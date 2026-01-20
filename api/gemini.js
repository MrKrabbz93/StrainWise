import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import redis from "../src/lib/redis.js";
import crypto from "crypto";

export default async function handler(req, res) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, type, history = [], systemPrompt, preferredProvider, preferredModel, reasoningEffort, tools } = req.body;

    // 1. PROVIDER SELECTION STRATEGY
    const envProvider = process.env.AI_PROVIDER;
    const provider = preferredProvider || envProvider || (process.env.OPENAI_API_KEY ? 'openai' : 'gemini');

    const cacheKeyParams = {
        prompt,
        type,
        history,
        systemPrompt,
        provider,
        model: preferredModel || "default",
        tools
    };

    try {
        const result = await cacheAIResponse(cacheKeyParams, async () => {
            console.log(`🤖 AI Request: Provider=${provider}, Model=${preferredModel || "Default"}`);
            let text = "";

            // --- OPENAI HANDLER ---
            if (provider === 'openai') {
                const openaiKey = process.env.OPENAI_API_KEY;
                if (!openaiKey) throw new Error("OpenAI API Key missing on server.");

                const openai = new OpenAI({ apiKey: openaiKey });
                const model = preferredModel || "gpt-5.2";

                const completionConfig = {
                    model: model,
                    max_tokens: 1000,
                };

                if (model.includes("gpt-5") || model.startsWith("o1")) {
                    completionConfig.reasoning_effort = reasoningEffort || "medium";
                    delete completionConfig.max_tokens;
                    completionConfig.max_completion_tokens = 1000;
                }

                if (type === 'chat') {
                    const messages = [
                        { role: "system", content: systemPrompt || "You are a helpful assistant." },
                        ...history.map(msg => ({
                            role: msg.role === 'model' ? 'assistant' : msg.role,
                            content: msg.content
                        })),
                        { role: "user", content: prompt }
                    ];

                    const completion = await openai.chat.completions.create({
                        ...completionConfig,
                        messages: messages,
                    });
                    text = completion.choices[0].message.content;
                } else {
                    const completion = await openai.chat.completions.create({
                        ...completionConfig,
                        messages: [{ role: "user", content: prompt }],
                    });
                    text = completion.choices[0].message.content;
                }
            }

            // --- GEMINI HANDLER ---
            else {
                let apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
                if (!apiKey) throw new Error("Gemini API Key missing on server.");

                const genAI = new GoogleGenerativeAI(apiKey);
                const targetModel = preferredModel || "gemini-2.0-flash-exp";
                const model = genAI.getGenerativeModel({ model: targetModel });

                if (type === 'chat') {
                    let validHistory = history.map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }],
                    }));

                    while (validHistory.length > 0 && validHistory[0].role === 'model') {
                        validHistory.shift();
                    }

                    const chat = model.startChat({
                        history: validHistory,
                        generationConfig: { maxOutputTokens: 500 },
                    });
                    const result = await chat.sendMessage(`${systemPrompt || ""}\nUser: ${prompt}`);
                    const response = await result.response;
                    text = response.text();
                } else {
                    const result = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        tools: tools
                    });
                    const response = await result.response;
                    text = response.text();
                }
            }

            return { text, provider, model: preferredModel || "default" };
        });

        return res.status(200).json(result);

    } catch (error) {
        console.error("AI Service Error:", error);
        return res.status(500).json({
            error: 'Failed to process AI request',
            details: error.message || error.toString()
        });
    }
}

/**
 * AI Caching Middleware / Helper
 */
async function cacheAIResponse(params, generateFn) {
    const { type } = params;
    const cacheKey = `ai_response:${crypto.createHash('sha256').update(JSON.stringify(params)).digest('hex')}`;

    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`🎯 Cache Hit: ${cacheKey}`);
            const data = JSON.parse(cached);
            return { ...data, cached: true };
        }
    } catch (e) {
        console.warn("Redis read error:", e);
    }

    const response = await generateFn();

    try {
        // User-specific queries: 15-30 minutes
        // General knowledge: 2-4 hours
        // Default: 1 hour
        let ttl = 3600;
        if (type === 'chat') ttl = 1800; // 30 mins
        if (type === 'generate') ttl = 14400; // 4 hours

        await redis.setex(cacheKey, ttl, JSON.stringify(response));
        console.log(`💾 Cache Set: ${cacheKey} (TTL: ${ttl}s)`);
    } catch (e) {
        console.warn("Redis write error:", e);
    }

    return { ...response, cached: false };
}
