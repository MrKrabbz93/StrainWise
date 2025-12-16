import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

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

    const { prompt, type, history = [], systemPrompt, preferredProvider, preferredModel, reasoningEffort } = req.body;

    // 1. PROVIDER SELECTION STRATEGY
    // Priority: Request -> Env Var -> Default (Gemini)
    const envProvider = process.env.AI_PROVIDER; // 'openai' or 'gemini'
    const provider = preferredProvider || envProvider || (process.env.OPENAI_API_KEY ? 'openai' : 'gemini');

    console.log(`🤖 AI Request: Provider=${provider}, Model=${preferredModel || "Default"}`);

    try {
        let text = "";

        // --- OPENAI HANDLER ---
        if (provider === 'openai') {
            const openaiKey = process.env.OPENAI_API_KEY;
            if (!openaiKey) throw new Error("OpenAI API Key missing on server.");

            const openai = new OpenAI({ apiKey: openaiKey });
            const model = preferredModel || "gpt-5.2"; // Default to SOTA GPT-5.2

            const completionConfig = {
                model: model,
                max_tokens: 1000,
            };

            // Enhanced reasoning for GPT-5.2 and o1 models
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
            // Allow user to specify "gemini-1.5-pro", "gemini-2.0-flash-exp", etc.
            // Fallback to the latest experimental flash if undefined.
            const targetModel = preferredModel || "gemini-2.0-flash-exp";

            const model = genAI.getGenerativeModel({ model: targetModel });

            if (type === 'chat') {
                // Sanitize history
                let validHistory = history.map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }],
                }));

                // Ensure starts with user
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
                const result = await model.generateContent(prompt);
                const response = await result.response;
                text = response.text();
            }
        }

        return res.status(200).json({ text, provider, model: preferredModel || "default" });

    } catch (error) {
        console.error("AI API Error:", error);
        return res.status(500).json({
            error: 'Failed to generate content',
            details: error.message || error.toString()
        });
    }
}
