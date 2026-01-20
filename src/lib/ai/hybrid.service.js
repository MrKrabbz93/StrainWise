import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from 'openai';

// Mock Metrics if missing, to prevent crash
const metricsService = {
    recordCircuitBreakerOpen: () => { },
    recordAiRequest: () => { }
};

// Helper for Env
const getEnv = (key) => {
    try { if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key]; } catch (e) { }
    try { if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key]; } catch (e) { }
    return undefined;
};

/**
 * CircuitBreaker
 * Prevents cascading failures by stopping calls after a threshold of failures.
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
                console.log("Circuit Breaker: Half-Open, testing connection...");
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
        if (this.state !== 'CLOSED') console.log("Circuit Breaker: Closed (Recovered)");
        this.failureCount = 0;
        this.state = 'CLOSED';
    }

    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            console.warn("Circuit Breaker: OPENED (Too many failures)");
            metricsService.recordCircuitBreakerOpen();
        }
    }
}

/**
 * HybridAIService
 * Orchestrates calls between the Backend API (OpenAI/Gemini) and Client-Side Fallbacks.
 */
export class HybridAIService {
    constructor() {
        this.clientApiKey = getEnv('VITE_GEMINI_API_KEY') || getEnv('GEMINI_API_KEY') || getEnv('API_KEY');
        this.genAI = this.clientApiKey ? new GoogleGenerativeAI(this.clientApiKey) : null;
        this.isNode = typeof window === 'undefined';

        // OpenAI Setup
        const openAiKey = getEnv('OPENAI_API_KEY');
        this.openai = openAiKey ? new OpenAI({ apiKey: openAiKey }) : null;

        // Zhipu Setup (GLM-4)
        this.zhipuKey = getEnv('VITE_ZHIPU_API_KEY') || getEnv('ZHIPU_API_KEY');
        this.zhipu = this.zhipuKey ? new OpenAI({
            apiKey: this.zhipuKey,
            baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
            dangerouslyAllowBrowser: true
        }) : null;

        // Models
        this.geminiFlash = this.genAI ? this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }) : null;

        // Resilience
        this.backendCircuit = new CircuitBreaker(3, 30000);
    }

    async generateResponse(payload) {
        const startTime = Date.now();
        let success = false;
        let provider = 'backend';
        let cached = false;

        try {
            // 1. If in Node (Worker), try Redis Cache first
            let redis = null;
            let cacheKey = null;
            if (this.isNode) {
                try {
                    const { default: r } = await import('../redis.js');
                    if (r && r.status === 'ready') {
                        redis = r;
                        const crypto = await import('crypto');
                        const cleanPayload = { ...payload };
                        cacheKey = `ai_worker:${crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;

                        const cachedData = await redis.get(cacheKey);
                        if (cachedData) {
                            console.log(`🎯 Worker Cache Hit: ${cacheKey}`);
                            cached = true;
                            success = true;
                            return JSON.parse(cachedData);
                        }
                    }
                } catch (e) { /* Redis optional */ }
            }

            // 2. Try OpenAI (Priority if configured)
            if (this.isNode && this.openai) {
                provider = 'openai-node';
                try {
                    const result = await this.callOpenAI(payload);
                    success = true;
                    // Cache result if possible
                    if (redis && cacheKey) await redis.setex(cacheKey, 3600, JSON.stringify(result));
                    return result;
                } catch (e) {
                    console.warn("OpenAI failed, falling back to Gemini:", e.message);
                }
            }

            // 3. (Skipped Zhipu)


            // 4. Try Gemini (Fallback)
            if (this.isNode && this.geminiFlash) {
                provider = 'gemini-node';
                try {
                    const prompt = payload.prompt || payload.messages?.map(m => m.content).join('\n');
                    const result = await this.geminiFlash.generateContent(prompt);
                    const text = result.response.text();
                    success = true;
                    if (redis && cacheKey) await redis.setex(cacheKey, 3600, JSON.stringify(text));
                    return text;
                } catch (e) {
                    console.warn("Gemini failed:", e.message);
                }
            }

            // 5. Client-Side Fallback (Browser Mode)
            if (this.geminiFlash) {
                provider = 'gemini-client';
                const result = await this.callClientGemini(payload);
                success = true;
                return result;
            }

            throw new Error("All AI services failed.");

        } finally {
            const duration = Date.now() - startTime;
            metricsService.recordAiRequest(provider, duration, success, cached);
        }
    }

    async callOpenAI(payload) {
        const prompt = payload.prompt || payload.messages?.map(m => m.content).join('\n');
        const completion = await this.openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini", // Cost effective & smart
        });
        return completion.choices[0].message.content;
    }

    async callZhipu(payload) {
        const prompt = payload.prompt || payload.messages?.map(m => m.content).join('\n');
        const systemPrompt = payload.systemPrompt ? { role: "system", content: payload.systemPrompt } : null;

        const messages = systemPrompt ? [systemPrompt, { role: "user", content: prompt }] : [{ role: "user", content: prompt }];

        const completion = await this.zhipu.chat.completions.create({
            messages: messages,
            model: "glm-4-air",
        });
        return completion.choices[0].message.content;
    }

    async callClientGemini(payload) {
        // Simplified fallback for browser
        const prompt = payload.prompt || payload.messages?.map(m => m.content).join('\n');
        const result = await this.geminiFlash.generateContent(prompt);
        return result.response.text();
    }

    async identifyStrain(base64Image) {
        // ... (simplified vision support)
        if (this.geminiFlash) {
            const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
            const prompt = "Identify this cannabis strain. Friendly chat.";
            const result = await this.geminiFlash.generateContent([prompt, { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } }]);
            return result.response.text();
        }
        return "Vision unavailable.";
    }
}
