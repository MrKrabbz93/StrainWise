import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { MODELS, TASKS, modelRouter } from './model-router.js';

// Mock Metrics if missing, to prevent crash
const metricsService = {
    recordCircuitBreakerOpen: () => { },
    recordAiRequest: () => { }
};

// Helper for Env
const getEnv = (key) => {
    try { if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key]; } catch (e) { }
    try { if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key]; } catch (e) { }
    return undefined;
};

/**
 * CircuitBreaker
 */
class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.failureThreshold = threshold;
        this.timeout = timeout;
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.state = 'CLOSED';
    }

    async call(action) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'HALF_OPEN';
            } else {
                metricsService.recordCircuitBreakerOpen();
                throw new Error('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await action();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }

    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            metricsService.recordCircuitBreakerOpen();
        }
    }
}

/**
 * HybridAIService
 */
export class HybridAIService {
    constructor() {
        this.isNode = typeof window === 'undefined';

        // 1. Gemini Initialization
        this.clientApiKey = getEnv('VITE_GEMINI_API_KEY') || getEnv('GEMINI_API_KEY');
        this.genAI = this.clientApiKey ? new GoogleGenerativeAI(this.clientApiKey) : null;

        // 2. OpenAI Initialization
        const openAiKey = getEnv('OPENAI_API_KEY');
        this.openai = openAiKey ? new OpenAI({ apiKey: openAiKey, dangerouslyAllowBrowser: true }) : null;

        // 3. Anthropic Initialization (Claude 4.6 / 3.7)
        const anthropicKey = getEnv('ANTHROPIC_API_KEY');
        const isOpenRouter = anthropicKey?.startsWith('sk-or-');
        this.anthropic = anthropicKey ? new Anthropic({
            apiKey: anthropicKey,
            baseURL: isOpenRouter ? 'https://openrouter.ai/api/v1' : undefined,
            dangerouslyAllowBrowser: true // Enable for client-side use
        }) : null;

        // 4. DeepSeek Initialization (OpenAI Compatible)
        const deepseekKey = getEnv('DEEPSEEK_API_KEY');
        this.deepseek = deepseekKey ? new OpenAI({
            apiKey: deepseekKey,
            baseURL: 'https://api.deepseek.com',
            dangerouslyAllowBrowser: true
        }) : null;

        // Resilience
        this.circuits = {
            openai: new CircuitBreaker(3, 30000),
            gemini: new CircuitBreaker(3, 30000),
            anthropic: new CircuitBreaker(2, 60000), // Tier 1 models get stricter thresholds
            deepseek: new CircuitBreaker(5, 15000),  // High-efficiency models recover faster
            backend: new CircuitBreaker(3, 30000)
        };
    }

    async generateResponse(payload) {
        const startTime = Date.now();
        let success = false;
        let providerUsed = 'unknown';

        try {
            // Task context extraction
            const taskType = payload.taskType || TASKS.CHAT_CASUAL;
            const priority = payload.priority || 'balanced';
            const selectedModelID = modelRouter.selectModel(taskType, priority);

            // Tool definitions for models that support it
            const tools = payload.tools || [];

            // 1. Browser Mode: Try Backend Relay First
            if (!this.isNode) {
                try {
                    return await this.circuits.backend.call(() => this.callBackend(payload));
                } catch (e) {
                    console.warn("Backend relay failed, using local execution.");
                }
            }

            // 2. Select Provider based on Router Decision
            if (selectedModelID.startsWith('claude') && this.anthropic) {
                providerUsed = 'anthropic';
                const result = await this.circuits.anthropic.call(() => this.callAnthropic(payload, selectedModelID, tools));
                success = true;
                return result;
            }

            if (selectedModelID.startsWith('deepseek') && this.deepseek) {
                providerUsed = 'deepseek';
                const result = await this.circuits.deepseek.call(() => this.callDeepSeek(payload, selectedModelID));
                success = true;
                return result;
            }

            if (selectedModelID.startsWith('gemini') && this.genAI) {
                providerUsed = 'gemini';
                const result = await this.circuits.gemini.call(() => this.callGemini(payload, selectedModelID, tools));
                success = true;
                return result;
            }

            // 3. Universal Fallback: Gemini Flash
            if (this.genAI) {
                providerUsed = 'gemini-fallback';
                const result = await this.callGemini(payload, MODELS.GEMINI_2_0_FLASH, tools);
                success = true;
                return result;
            }

            throw new Error("No available AI provider for selected model: " + selectedModelID);
        } finally {
            metricsService.recordAiRequest(providerUsed, Date.now() - startTime, success);
        }
    }

    async callAnthropic(payload, model, tools) {
        // Implement tool calling loop for Claude if tool definitions are provided
        const messages = [{ role: "user", content: payload.prompt }];
        const toolConfig = tools.length > 0 ? {
            tools: tools.map(t => ({
                name: t.name,
                description: t.description,
                input_schema: t.inputSchema
            }))
        } : {};

        const response = await this.anthropic.messages.create({
            model: this.anthropic.baseURL?.includes('openrouter.ai') && !model.includes('/')
                ? `anthropic/${model}`
                : model,
            max_tokens: 1024,
            system: payload.systemPrompt || "",
            messages: messages,
            ...toolConfig
        });

        if (response.stop_reason === 'tool_use') {
            const toolCall = response.content.find(c => c.type === 'tool_use');
            if (toolCall) {
                console.log(`🛠️ AI calling tool: ${toolCall.name}`);
                const toolResult = await this.handleToolExecution(toolCall.name, toolCall.input);

                // Second call with tool result
                const secondResponse = await this.anthropic.messages.create({
                    model: model,
                    max_tokens: 1024,
                    system: payload.systemPrompt || "",
                    messages: [
                        ...messages,
                        { role: 'assistant', content: response.content },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'tool_result',
                                    tool_use_id: toolCall.id,
                                    content: JSON.stringify(toolResult),
                                },
                            ],
                        },
                    ],
                });
                return secondResponse.content[0].text;
            }
        }

        return response.content[0].text;
    }

    async callDeepSeek(payload, model) {
        const response = await this.deepseek.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: payload.systemPrompt || "" },
                { role: "user", content: payload.prompt }
            ],
        });
        return response.choices[0].message.content;
    }

    async callGemini(payload, modelID, tools) {
        // Gemini tool support
        const model = this.genAI.getGenerativeModel({
            model: modelID,
            systemInstruction: payload.systemPrompt || ""
        });

        // Convert tool schema for Gemini
        const geminiTools = tools.length > 0 ? [{
            functionDeclarations: tools.map(t => ({
                name: t.name,
                description: t.description,
                parameters: t.inputSchema
            }))
        }] : [];

        const chat = model.startChat({
            tools: geminiTools
        });

        const result = await chat.sendMessage(payload.prompt);
        const call = result.response.functionCalls()?.[0];

        if (call) {
            console.log(`🛠️ Gemini calling tool: ${call.name}`);
            const toolResult = await this.handleToolExecution(call.name, call.args);
            const secondResult = await chat.sendMessage([{
                functionResponse: {
                    name: call.name,
                    response: { content: toolResult }
                }
            }]);
            return secondResult.response.text();
        }

        return result.response.text();
    }

    /**
     * Internal Tool Execution Router
     * Mirrors the logic from MCP Servers but executes directly in-process for speed.
     */
    async handleToolExecution(name, args) {
        try {
            switch (name) {
                case "get_nearby_stock": {
                    const { data: shops } = await supabase
                        .from("dispensaries")
                        .select("id, name, address")
                        .ilike("city", `%${args.location}%`);

                    if (!shops?.length) return { error: "No shops found in that city." };

                    const { data: inventory } = await supabase
                        .from("dispensary_inventory")
                        .select("dispensary_id, price_eighth, in_stock")
                        .in("dispensary_id", shops.map(s => s.id))
                        .ilike("strain_id", `%${args.strainName}%`)
                        .eq("in_stock", true);

                    return inventory?.map(inv => ({
                        shop: shops.find(s => s.id === inv.dispensary_id)?.name,
                        price: inv.price_eighth,
                        status: "In Stock"
                    })) || [];
                }
                default:
                    return { error: "Unknown tool" };
            }
        } catch (e) {
            return { error: e.message };
        }
    }

    async callBackend(payload) {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Backend API failure");
        return await response.json();
    }

    async identifyStrain(base64Image) {
        if (!this.genAI) return "Vision unavailable.";
        const model = this.genAI.getGenerativeModel({ model: MODELS.GEMINI_2_0_FLASH });
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        const result = await model.generateContent([
            "Identify this cannabis strain. Friendly chat.",
            { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } }
        ]);
        return result.response.text();
    }
}
