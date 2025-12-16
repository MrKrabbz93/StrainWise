import { GoogleGenerativeAI } from "@google/generative-ai";
import { metricsService } from "../deployment/metrics.service.js";

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
    // ... (Keep existing implementation or assume it's there? I need to preserve it if I replace chunks)
    // To save tokens/complexity, I will replace the CLASS if it's small or just the top block?
    // The previous view showed lines 1-174. I can replace the whole file?
    // It's 174 lines. I'll replace chunks to be safer.
    constructor(threshold = 5, timeout = 60000) {
        this.failureThreshold = threshold;
        this.timeout = timeout;
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.state = 'CLOSED';
    }
    // ... (omitted methods to avoid replace error, I'll allow multiple chunks or just replace header and class methods)
    // Using MultiReplace is better if I want to target specific parts.
    // But I need to define `getEnv` at top scope.

    // I will use replace_file_content for the whole file to ensure clean Refactor.
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
        this.clientApiKey = getEnv('VITE_GEMINI_API_KEY') || getEnv('GEMINI_API_KEY');
        this.genAI = this.clientApiKey ? new GoogleGenerativeAI(this.clientApiKey) : null;
        this.isNode = typeof window === 'undefined';

        // Models
        this.geminiFlash = this.genAI ? this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }) : null;

        // Resilience
        this.backendCircuit = new CircuitBreaker(3, 30000);
    }

    /**
     * Main entry point for Chat/Text generation.
     */
    async generateResponse(payload) {
        const startTime = Date.now();
        let success = false;
        let provider = 'backend';

        try {
            // 1. If in Node (Worker), skip backend fetch and go direct to SDK
            if (this.isNode) {
                if (!this.geminiFlash) throw new Error("Worker Missing GEMINI_API_KEY");
                provider = 'gemini-node';
                const result = await this.callClientGemini(payload);
                success = true;
                return result;
            }

            // 2. Try Backend (Browser Mode)
            const data = await this.backendCircuit.call(() => this.callBackend(payload));
            success = true;
            return data.text;
        } catch (serverError) {
            console.warn(`HybridService: Backend failed (${serverError.message}), attempting client-side fallback.`);

            // 3. Client-Side Fallback (Browser Mode)
            if (this.geminiFlash) {
                provider = 'gemini-client';
                try {
                    const result = await this.callClientGemini(payload);
                    success = true;
                    return result;
                } catch (clientError) {
                    throw clientError;
                }
            }

            throw new Error("All AI services failed. Please check connection.");
        } finally {
            const duration = Date.now() - startTime;
            // metricsService might need adaptation for Node? It's fine if it logs to console or analytics API.
            // If metrics calls browser API, wrap it.
            try { metricsService.recordAiRequest(provider, duration, success); } catch (e) { }
        }
    }

    async identifyStrain(base64Image) {
        // Direct SDK usage for both (Vision model via API is same as client)
        // If Node, works. If Client, works.
        const startTime = Date.now();
        let success = false;

        if (this.geminiFlash) {
            try {
                const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
                const prompt = "Identify this cannabis strain. Analyze color, structure, and trichomes. Estimate Indica/Sativa. Return as friendly chat.";

                const result = await this.geminiFlash.generateContent([
                    prompt,
                    { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } }
                ]);
                const response = await result.response;
                success = true;
                return response.text();
            } catch (e) {
                console.error("Vision failed:", e);
            } finally {
                try { metricsService.recordAiRequest('gemini-vision', Date.now() - startTime, success); } catch (e) { }
            }
        }
        return "Visual identification unavailable.";
    }

    // --- Internal Methods ---

    async callBackend(payload) {
        if (this.isNode) throw new Error("Cannot call Backend API from Node environment");
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.details || err.error || "Server Error");
        }
        return await response.json();
    }

    async callClientGemini(payload) {
        if (payload.type === 'chat') {
            const history = (payload.history || []).map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            })).filter(msg => msg.role !== 'model' || msg.parts[0].text);

            while (history.length > 0 && history[0].role === 'model') history.shift();

            const chat = this.geminiFlash.startChat({
                history,
                generationConfig: { maxOutputTokens: 500 }
            });

            const msg = `${payload.systemPrompt || ''}\nUser: ${payload.prompt}`;
            const result = await chat.sendMessage(msg);
            const response = await result.response;
            return response.text();
        } else {
            const result = await this.geminiFlash.generateContent(payload.prompt);
            const response = await result.response;
            return response.text();
        }
    }
}
