import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API (Legacy/Dev Mode)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

export const isAIEnabled = () => !!API_KEY;

// Helper to switch between Direct (Dev) and Backend (Prod)
const callGemini = async (payload) => {
    // In a real scenario, we'd check import.meta.env.PROD
    // For this implementation, we try the backend first, fallback to direct if it fails (or if we are in dev and want direct)
    // However, to test the backend, we should try it. 
    // But since we don't have the backend running locally (no `vercel dev`), we must stick to direct for local dev.

    // STRATEGY: 
    // If we are in PROD, use fetch('/api/gemini'). 
    // If we are in DEV, use direct SDK.

    if (import.meta.env.PROD) {
        try {
            console.log("Attempting backend call to /api/gemini...");
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error("Backend Error Response:", errData);
                throw new Error(errData.error || `Server responded with ${response.status}`);
            }

            const data = await response.json();
            return data.text;
        } catch (e) {
            console.error("Backend failed:", e);
            // If backend exists but fails (e.g. 500), we should probably notify the user 
            // instead of silently falling back to a null model which triggers "Demo Mode".
            // Let's return the error message for debugging.
            return `System Error: ${e.message}. (Please verify Vercel Env Vars)`;
        }
    }

    // Direct SDK (Dev Mode / Fallback)
    if (!model) {
        console.warn("Client-side Gemini model not initialized (Missing Key?)");
        await new Promise(r => setTimeout(r, 1000));
        return null; // Signal demo mode
    }

    if (payload.type === 'chat') {
        const chat = model.startChat({
            history: payload.history.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            })),
            generationConfig: { maxOutputTokens: 200 },
        });
        const result = await chat.sendMessage(`${payload.systemPrompt}\nUser: ${payload.prompt}`);
        const response = await result.response;
        return response.text();
    } else {
        const result = await model.generateContent(payload.prompt);
        const response = await result.response;
        return response.text();
    }
};

export const generateResponse = async (history, userMessage, persona = "helpful", location = null) => {
    let systemPrompt = getPersonaPrompt(persona);

    if (location) {
        systemPrompt += `\n\nCONTEXT: The user is currently located at Coordinates: ${location.lat}, ${location.lng}. 
        If they ask about "nearby" or "local" availability, acknowledge their location context (e.g., "I see you are in [City/Area based on coords if known, otherwise just acknowledge local context]").`;
    }

    const response = await callGemini({
        type: 'chat',
        prompt: userMessage,
        history,
        systemPrompt
    });

    if (!response) return "I'm currently in demo mode. To unlock my full AI capabilities, please add a VITE_GEMINI_API_KEY to your .env file.";
    return response;
};

export const generateSalesCopy = async (strainName, userNeeds) => {
    const prompt = `Write a short, punchy, high-end marketing sales pitch (max 2 sentences) for the cannabis strain "${strainName}". 
    Target audience need: "${userNeeds}". 
    Tone: Luxurious, exclusive, and persuasive.`;

    const response = await callGemini({ type: 'generate', prompt });

    if (!response) return `Experience the magic of ${strainName}. Perfect for your needs.`;
    return response;
};

export const generateCustomerReviews = async (strainName) => {
    if (!isAIEnabled() && !import.meta.env.PROD) {
        return [
            { user: "Sarah M.", text: "This strain completely erased my migraine within minutes. I could finally focus on my work.", rating: 5 },
            { user: "James K.", text: "Incredible for my anxiety. It didn't make me sleepy, just incredibly calm and present.", rating: 5 }
        ];
    }

    const prompt = `Simulate 2 authentic, insightful customer reviews for the cannabis strain "${strainName}". 
    Focus on "deep insights" into what the strain did for them or how it specifically helped with a condition (e.g., pain, anxiety, creativity, sleep).
    Avoid generic praise. Make them sound like real people sharing their relief or experience.
    Format the output strictly as a JSON array of objects with keys: "user" (e.g., "Firstname L."), "text", "rating" (integer 1-5).
    Example: [{"user": "Elena R.", "text": "Helped me sleep through the night for the first time in months.", "rating": 5}]`;

    try {
        const text = await callGemini({ type: 'generate', prompt });
        if (!text) throw new Error("Demo mode");
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error generating reviews:", error);
        return [
            { user: "AI User", text: "This strain is known for its therapeutic benefits.", rating: 4 },
            { user: "Guest", text: "A reliable choice for relief.", rating: 4 }
        ];
    }
};

export const generateStrainEncyclopediaEntry = async (strainName) => {
    if (!isAIEnabled() && !import.meta.env.PROD) {
        return {
            name: strainName,
            description: "A legendary strain with a rich history. (AI Demo Mode)",
            lineage: "Unknown x Unknown",
            type: "Hybrid",
            thc: "20-25%",
            terpenes: ["Myrcene", "Caryophyllene", "Limonene"],
            effects: ["Relaxed", "Happy", "Euphoric"],
            medical: ["Stress", "Pain", "Anxiety"],
            growing: "Moderate difficulty. 8-9 weeks flowering time.",
            visual_profile: "green_sativa"
        };
    }

    const prompt = `Generate a comprehensive encyclopedia entry for the cannabis strain "${strainName}".
    Include:
    - Description (2-3 sentences, history/origin)
    - Lineage (Parent strains)
    - Type (Indica/Sativa/Hybrid)
    - THC Range (e.g., "18-24%")
    - Top 3 Terpenes
    - Top 3 Effects
    - Top 3 Medical Uses
    - Growing Info (Difficulty, Flowering Time)
    - Visual Profile: Choose ONE of the following that best describes this strain's typical appearance: "purple", "green_sativa", "frosty", "orange", "dark".
    
    Format strictly as JSON with keys: "name", "description", "lineage", "type", "thc", "terpenes" (array), "effects" (array), "medical" (array), "growing", "visual_profile".`;

    try {
        const text = await callGemini({ type: 'generate', prompt });
        if (!text) throw new Error("Demo mode");
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error generating encyclopedia entry:", error);
        return null;
    }
};

export const generateWelcomeMessage = async (userName) => {
    if (!isAIEnabled() && !import.meta.env.PROD) {
        return {
            subject: "Welcome to the Inner Circle",
            body: `Welcome, ${userName}. You have unlocked access to StrainWise. Our AI Consultant is ready to guide your journey.`
        };
    }

    const prompt = `Write a short, exclusive, high-value "Welcome Email" for a new user named "${userName}" joining "StrainWise" (a premium AI cannabis consultant app).
    Tone: Sophisticated, Warm, Exclusive.
    Key Points to Mention:
    1. Access to the "AI Consultant" for personalized guidance.
    2. The "Strain Encyclopedia" with visual profiles.
    3. The new "Community" feature to connect with others.
    Format strictly as JSON with keys: "subject", "body".`;

    try {
        const text = await callGemini({ type: 'generate', prompt });
        if (!text) throw new Error("Demo mode");
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error generating welcome message:", error);
        return {
            subject: "Welcome to StrainWise",
            body: "We are honored to have you join our community of connoisseurs."
        };
    }
};

const getPersonaPrompt = (persona) => {
    switch (persona) {
        case "scientist":
            return `You are "The Scientist", a cannabis researcher and biochemist. 
            Tone: Clinical, precise, objective, and educational.
            Focus: Terpenes, cannabinoids (THC, CBD, CBN, etc.), the endocannabinoid system, and physiological effects.
            Instructions: Explain *why* a strain works based on its chemical profile. Cite studies or scientific principles where possible. Avoid slang.`;
        case "connoisseur":
            return `You are "The Connoisseur", a high-end cannabis sommelier.
            Tone: Sophisticated, poetic, sensory-focused, and exclusive.
            Focus: Flavor profiles (nose/taste), lineage/genetics, bag appeal, and the "entourage effect" as a luxury experience.
            Instructions: Describe strains like fine wine. Use evocative language. Focus on the art of cultivation and the purity of the experience.`;
        case "helpful":
        default:
            return `You are "The Guide", a friendly and accessible cannabis consultant.
            Tone: Warm, welcoming, empathetic, and easy to understand.
            Focus: Practical advice, finding relief, and making the user feel comfortable.
            Instructions: Avoid overly technical jargon. Focus on how the user will *feel*. Be a supportive companion on their wellness journey.`;
    }
};
