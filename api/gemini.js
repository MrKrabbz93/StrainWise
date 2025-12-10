import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const { prompt, type, history = [], systemPrompt } = req.body;
    let apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) apiKey = apiKey.trim();

    console.log("Server Debug - API Key Check:", {
        exists: !!apiKey,
        length: apiKey ? apiKey.length : 0,
        snippet: apiKey ? `${apiKey.slice(0, 4)}...` : "MISSING"
    });

    if (type === 'health') {
        return res.status(200).json({
            status: 'online',
            serverLocation: process.env.VERCEL_REGION || 'unknown',
            keyConfigured: !!apiKey,
            keyLength: apiKey ? apiKey.length : 0
        });
    }

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let text = "";

        if (type === 'chat') {
            // Sanitize history: Ensure it starts with 'user'
            let validHistory = history.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            }));

            // Remove leading model messages until we find a user message
            while (validHistory.length > 0 && validHistory[0].role === 'model') {
                validHistory.shift();
            }

            const chat = model.startChat({
                history: validHistory,
                generationConfig: { maxOutputTokens: 500 },
            });
            const result = await chat.sendMessage(`${systemPrompt}\nUser: ${prompt}`);
            const response = await result.response;
            text = response.text();
        } else {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            text = response.text();
        }

        return res.status(200).json({ text });
    } catch (error) {
        console.error("Gemini API Backend Error:", error);
        // Extract mostly useful info from the error object
        const errorMessage = error.response ? JSON.stringify(await error.response.json()) : error.message;
        return res.status(500).json({
            error: 'Failed to generate content',
            details: errorMessage,
            model: "gemini-1.5-flash"
        });
    }
}
