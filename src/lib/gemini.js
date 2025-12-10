import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API (Legacy/Dev Mode)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const getModel = () => genAI.getGenerativeModel({ model: "gemini-3.0-pro" });
const getFallbackModel = () => genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
let model = getModel();

export const isAIEnabled = () => {
    return !!API_KEY;
};

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
                // Throw the detailed message if available, otherwise the generic error
                throw new Error(errData.details || errData.error || `Server responded with ${response.status}`);
            }

            const data = await response.json();
            return data.text;
        } catch (e) {
            console.error("Backend failed, falling back to client-side SDK:", e);
            // Continue execution to fallback block below...
        }
    }

    // Direct SDK (Dev Mode / Fallback)
    if (!model) {
        console.warn("Client-side Gemini model not initialized (Missing Key?)");
        await new Promise(r => setTimeout(r, 1000));
        return null; // Signal demo mode
    }

    const performRequest = async (currentModel) => {
        if (payload.type === 'chat') {
            // Gemini requires history to start with 'user'. Filter out initial 'model' greeting if present.
            let validHistory = payload.history.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            }));

            // Remove leading model messages until we find a user message
            while (validHistory.length > 0 && validHistory[0].role === 'model') {
                validHistory.shift();
            }

            const chat = currentModel.startChat({
                history: validHistory,
                generationConfig: { maxOutputTokens: 200 },
            });
            const result = await chat.sendMessage(`${payload.systemPrompt}\nUser: ${payload.prompt}`);
            const response = await result.response;
            return response.text();
        } else {
            const result = await currentModel.generateContent(payload.prompt);
            const response = await result.response;
            return response.text();
        }
    };

    const getSafetyNetModel = () => genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // ... inside callGemini ...

    try {
        return await performRequest(model);
    } catch (err) {
        console.warn("Client-side Gemini 3.0 Pro failed, trying fallback to 1.5 Pro:", err);
        try {
            return await performRequest(getFallbackModel());
        } catch (fallbackErr) {
            console.warn("Gemini 1.5 Pro failed, trying safety net (1.5 Flash):", fallbackErr);
            try {
                return await performRequest(getSafetyNetModel());
            } catch (finalErr) {
                console.error("All Gemini models (3.0, 1.5 Pro, Flash) failed:", finalErr);
                throw finalErr;
            }
        }
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

    if (!response) return "⚠️ Debug: Client-side AI failed. Are you on Localhost? If so, you need a .env file. If on Vercel, the Backend failed silently.";
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
        if (!text || text.startsWith("System Error")) throw new Error("AI Generation Failed");

        try {
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (parseErr) {
            console.error("JSON Parse Error:", parseErr);
            throw new Error("Invalid format");
        }
    } catch (error) {
        console.error("Error generating reviews:", error);
        return [
            { user: "AI User", text: "This strain is known for its therapeutic benefits.", rating: 4 },
            { user: "Guest", text: "A reliable choice for relief.", rating: 4 }
        ];
    }
};

import { supabase } from './supabase';

export const generateStrainEncyclopediaEntry = async (strainName) => {
    // 1. Check Supabase DB first (The "Encyclopedia")
    try {
        const { data, error } = await supabase
            .from('strains')
            .select('*')
            .ilike('name', strainName) // Case-insensitive match
            .maybeSingle();

        if (!error && data) {
            console.log("Found in Encyclopedia:", data.name);
            return data;
        }
    } catch (err) {
        console.warn("DB Read Error:", err);
    }

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
        if (!text || text.startsWith("System Error")) throw new Error("AI Generation Failed: " + text);

        let aiData;
        try {
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            aiData = JSON.parse(jsonStr);
        } catch (parseErr) {
            console.error("JSON Parse Error for Encyclopedia:", parseErr);
            return null; // Return null to signal UI to show error or keep loading state
        }

        // 2. Save to Supabase (Grow the Encyclopedia)
        try {
            await supabase.from('strains').insert([{
                name: aiData.name, // Ensure exact name match
                description: aiData.description,
                type: aiData.type,
                thc: aiData.thc,
                lineage: aiData.lineage,
                terpenes: aiData.terpenes,
                effects: aiData.effects,
                medical: aiData.medical,
                growing: aiData.growing,
                visual_profile: aiData.visual_profile
            }]);
            console.log("Saved new knowledge to Encyclopedia:", aiData.name);

            // 3. THE MYCELIUM EFFECT (Recursive Expansion)
            expandLineage(aiData.lineage);

        } catch (dbErr) {
            console.error("Failed to save to DB:", dbErr);
        }

        return aiData;
    } catch (error) {
        console.error("Error generating encyclopedia entry:", error);
        return null;
    }
};

// Recursive Background Expansion
const expandLineage = async (lineageString) => {
    if (!lineageString || lineageString.toLowerCase().includes('unknown')) return;

    // Split lineage string (e.g., "Blueberry x Haze" -> ["Blueberry", "Haze"])
    const parents = lineageString.split(/ x | \/ /).map(p => p.trim()).filter(p => p.length > 2);

    console.log(`🍄 Mycelium Network: Discovered parents of current strain:`, parents);

    parents.forEach(async (parentName) => {
        // Random check to prevent infinite loops or exploding quotas in one go
        if (Math.random() > 0.7) return;

        // Check if parent exists
        const { data } = await supabase.from('strains').select('id').ilike('name', parentName).maybeSingle();

        if (!data) {
            console.log(`🍄 Mycelium Network: Spawning agent to discover '${parentName}'...`);
            // Recursively call the main generation function (which will save it and trigger its own parents!)
            generateStrainEncyclopediaEntry(parentName);
        }
    });
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
        if (!text || text.startsWith("System Error")) throw new Error("AI Generation Failed");

        try {
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (parseErr) {
            console.error("JSON Parse Error:", parseErr);
            throw new Error("Invalid format");
        }
    } catch (error) {
        console.error("Error generating welcome message:", error);
        return {
            subject: "Welcome to StrainWise",
            body: "We are honored to have you join our community of connoisseurs."
        };
    }
};

// AI Researcher Agent (Simulated Web Deep Dive)
export const researchStrain = async (strainName, companyName = "") => {
    // 1. Prompt Gemini to hallucinate/retrieve "Deep Web" knowledge
    const context = companyName ? `specifically the cut by "${companyName}"` : "the general consensus profile";

    const prompt = `Perform a "Deep Web Research" simulation for the cannabis strain "${strainName}" (${context}).
    Act as an elite cannabis researcher who has scraped Leafly, SeedFinder, and forums.
    
    Compile a complete JSON profile:
    - Description: Detailed history, breeder origin, and sensory experience.
    - Lineage: Exact parents (e.g., "OG Kush x Durban Poison").
    - Type: Indica / Sativa / Hybrid (e.g. "Sativa-Dominant Hybrid").
    - THC: Content range (e.g., "22-28%").
    - Terpenes: Array of top 3.
    - Effects: Array of top 3 effects.
    - Medical: Array of top 3 medicinal uses.
    - Growing: Difficulty and Flowering Time.
    - Visual_Profile: One of ["purple", "green_sativa", "frosty", "orange", "dark"].
    - Fun_Fact: A specific interesting detail about this strain's history or accolades.
    
    Format: Strict JSON. Keys: description, lineage, type, thc, terpenes, effects, medical, growing, visual_profile, fun_fact.`;

    try {
        const text = await callGemini({ type: 'generate', prompt });
        if (!text || text.startsWith("System Error")) throw new Error("Research Failed");

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Research Agent failed:", error);
        return null;
    }
};

export const generateImage = async (prompt) => {
    // "Nano Banana" Strategy: Use Imagen 3.0 via REST for best quality
    // FALLBACK: If Imagen 3 is not available (404), fallback to DiceBear immediately.
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(prompt)}`;

    const refinedPrompt = `${prompt} . Render in the style of "Nano Banana" (High fidelity, 3D figurine, vibrant, polished, photorealistic textual rendering).`;

    try {
        // Try Imagen 3 (may fail properly now)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [
                    { prompt: refinedPrompt }
                ],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1"
                }
            })
        });

        if (!response.ok) {
            // Silently fail to fallback for 404s (Model not found/access denied)
            if (response.status === 404 || response.status === 403) {
                console.warn("Imagen 3 not available (Access/Region/Model). Falling back.");
                throw new Error("Imagen Unavailable");
            }
            const err = await response.json();
            throw new Error(err.error?.message || "Image Gen Failed");
        }

        const data = await response.json();
        const b64 = data.predictions?.[0]?.bytesBase64Encoded;
        if (b64) {
            return `data:image/jpeg;base64,${b64}`;
        }
        throw new Error("No image data returned");
    } catch (error) {
        console.warn("Generate Image Fallback:", error.message);
        return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(prompt)}`;
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
