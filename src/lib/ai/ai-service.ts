import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { modelRouter, MODELS } from './model-router';
import { costTracker } from './cost-tracker';
import { logger } from '../logger';
import { supabase } from '../supabase';

const getEnv = (key: string) => {
    // Vite / Client Side
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[key] || import.meta.env[`VITE_${key}`];
    }
    // Node / Server Side
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
    }
    return undefined;
};

class AIService {
    private openai: OpenAI;
    private anthropic: Anthropic;
    private googleGenAI: GoogleGenerativeAI;

    constructor() {
        const openaiKey = getEnv('OPENAI_API_KEY');
        const anthropicKey = getEnv('ANTHROPIC_API_KEY');
        const geminiKey = getEnv('GEMINI_API_KEY');

        this.openai = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true }); // Allow browser for testing if needed
        this.anthropic = new Anthropic({ apiKey: anthropicKey });
        this.googleGenAI = new GoogleGenerativeAI(geminiKey);
    }

    async generateText({ prompt, system, task, userId, priority }) {
        let model = modelRouter.selectModel(task, priority);
        const promptHash = this.hashString(prompt);
        const systemHash = system ? this.hashString(system) : 'none';

        // 1. Check Cache
        try {
            const { data: cached } = await supabase
                .from('response_cache')
                .select('response')
                .eq('prompt_hash', promptHash)
                .eq('system_hash', systemHash)
                .gt('expires_at', new Date().toISOString())
                .maybeSingle();

            if (cached) {
                logger.info('Cache Hit 🎯');
                // Track 'saved' cost? Or just 0.
                await costTracker.trackUsage(userId, 'cache', task, 0, 0);
                return cached.response;
            }
        } catch (err) {
            // Cache miss/error allowed
            console.warn("Cache check failed", err);
        }

        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
            try {
                attempts++;
                logger.info(`Generating text with model: ${model}`);

                let responseText = '';
                let inputTokens = 0;
                let outputTokens = 0;

                // --- PROVIDER ROUTING ---
                if (model.startsWith('gpt')) {
                    const completion = await this.openai.chat.completions.create({
                        model: model,
                        messages: [
                            { role: 'system', content: system || 'You are a helpful assistant.' },
                            { role: 'user', content: prompt }
                        ],
                    });
                    responseText = completion.choices[0].message.content;
                    inputTokens = completion.usage.prompt_tokens;
                    outputTokens = completion.usage.completion_tokens;

                } else if (model.startsWith('claude')) {
                    const msg = await this.anthropic.messages.create({
                        model: model,
                        max_tokens: 1024,
                        system: system,
                        messages: [{ role: 'user', content: prompt }]
                    });
                    responseText = msg.content[0].text;
                    inputTokens = msg.usage.input_tokens;
                    outputTokens = msg.usage.output_tokens;

                } else if (model.startsWith('gemini')) {
                    const genModel = this.googleGenAI.getGenerativeModel({ model: model });
                    const chat = genModel.startChat({
                        history: system ? [{ role: 'user', parts: [{ text: `System Instruction: ${system}` }] }, { role: 'model', parts: [{ text: 'Understood.' }] }] : [],
                    });
                    const result = await chat.sendMessage(prompt);
                    const response = await result.response;
                    responseText = response.text();
                    inputTokens = prompt.length / 4;
                    outputTokens = responseText.length / 4;
                }

                // --- COST TRACKING ---
                await costTracker.trackUsage(userId, model, task, inputTokens, outputTokens);

                // --- CACHE WRITE ---
                try {
                    await supabase.from('response_cache').insert({
                        prompt_hash: promptHash,
                        system_hash: systemHash,
                        model: model,
                        response: responseText,
                        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 Days
                    });
                } catch (cacheErr) {
                    logger.warn('Failed to write to cache', cacheErr);
                }

                return responseText;

            } catch (error) {
                logger.error(`Generation failed with ${model}`, { error });
                if (attempts >= maxAttempts) throw error;

                // Fallback Logic
                if (model === MODELS.GPT4_TURBO) model = MODELS.GPT4_TURBO;
                if (model === MODELS.CLAUDE3_OPUS) model = MODELS.CLAUDE3_SONNET;
                else if (model.includes('gpt')) model = MODELS.GEMINI_FLASH;
                else if (model.includes('claude')) model = MODELS.GPT4_TURBO;

                logger.warn(`Falling back to ${model}`);
            }
        }
    }

    private hashString(str: string): string {
        // Simple hash sufficient for cache keys
        let hash = 0, i, chr;
        if (str.length === 0) return hash.toString();
        for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash.toString();
    }

    async generateImage({ prompt, userId }) {
        try {
            const response = await this.openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
            });
            const imageUrl = response.data[0].url;

            // DALL-E 3 fixed pricing roughly $0.04/img standard
            await costTracker.trackUsage(userId, 'dall-e-3', 'image_generation', 0, 0, { costUSD: 0.04 });

            return imageUrl;
        } catch (error) {
            logger.error('Image generation failed', { error });
            throw error;
        }
    }
}

export const aiService = new AIService();
