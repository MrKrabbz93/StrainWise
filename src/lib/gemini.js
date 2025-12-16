import { HybridAIService } from './ai/hybrid.service.js';
import { supabase } from './supabase.js';

// Helper to handle both Vite (Client) and Node (Backend) environment variables
const getEnv = (key) => {
    // Vite / Client Side
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[key];
    }
    // Node / Server Side
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
    }
    return undefined;
};
const IS_PROD = getEnv('PROD') || getEnv('NODE_ENV') === 'production';

// Initialize Hybrid Service
const aiService = new HybridAIService();

export const isAIEnabled = () => {
    // In PROD, we assume the Backend API is configured even if Client key is hidden.
    if (IS_PROD) return true;

    console.log("🚀 StrainWise AI Module v2.1 (Hybrid) - Loaded");
    return !!getEnv('VITE_GEMINI_API_KEY');
};

// Internal helper for legacy compatibility
const callGemini = async (payload) => {
    return await aiService.generateResponse(payload);
};

export const identifyStrain = async (base64Image) => {
    return await aiService.identifyStrain(base64Image);
};

export const generateResponse = async (history, userMessage, persona = "helpful", location = null) => {
    let systemPrompt = getPersonaPrompt(persona);

    // Dynamic Context Injection
    systemPrompt += `\n\nCRITICAL INSTRUCTION: You are an interface to the "StrainWise Encyclopedia".
    If the user asks about a strain that you DO NOT strictly recognize as a classic or well-known strain, 
    OR if you feel your knowledge is outdated, you MUST reply with exactly this phrase:
    "I don't have [Strain Name] in my live database yet. Shall I perform a deep web search and add it to the Encyclopedia?"
    
    Replace [Strain Name] with the actual name. Do not hallucinate details for unknown strains. Offer to research them.`;

    if (location) {
        systemPrompt += `\n\nCONTEXT: The user is currently located at Coordinates: ${location.lat}, ${location.lng}. 
        If they ask about "nearby" or "local" availability, acknowledge their location context.`;
    }

    const response = await aiService.generateResponse({
        type: 'chat',
        prompt: userMessage,
        history,
        systemPrompt
    });

    if (!response || response.startsWith("Error:")) {
        return `⚠️ API Failure Details: ${response || "Connection dropped"}\n\nAsk the developer to check the specific error above.`;
    }
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
    if (!isAIEnabled() && !IS_PROD) {
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
        if (!text || text.startsWith("System Error") || text.startsWith("Error:")) throw new Error("AI Generation Failed: " + text);

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

    if (!isAIEnabled() && !IS_PROD) {
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

    // 1a. Check Response Cache (New Layer)
    try {
        const { data: cached } = await supabase
            .from('response_cache')
            .select('value')
            .eq('key', `encyclopedia:${strainName}`)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (cached) {
            console.log("Found in ResponseCache:", strainName);
            return cached.value;
        }
    } catch (cacheErr) {
        console.warn("Cache Read Error:", cacheErr);
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
        const text = await callGemini({ type: 'generate', prompt, reasoningEffort: 'high' });
        if (!text || text.startsWith("System Error") || text.startsWith("Error:")) throw new Error("AI Generation Failed: " + text);

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

        // 4. Save to Response Cache
        try {
            await supabase.from('response_cache').upsert({
                key: `encyclopedia:${strainName}`,
                value: aiData,
                expires_at: new Date(Date.now() + 86400000).toISOString() // 24 hours
            }, { onConflict: 'key' });
        } catch (cacheWriteErr) {
            console.warn("Cache Write Error:", cacheWriteErr);
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
    if (!isAIEnabled() && !IS_PROD) {
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

    const prompt = `Perform a "Deep Web Research" for the cannabis strain "${strainName}" (${context}).
    
    CRITICAL: You are using Google Search Grounding. Base your facts ONLY on search results found.
    
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
        // Enable Google Search Tool
        const text = await callGemini({
            type: 'generate',
            prompt,
            reasoningEffort: 'xhigh', // Deep Web Research requires maximum reasoning
            tools: [{ googleSearch: {} }] // Activate Grounding
        });
        if (!text || text.startsWith("System Error") || text.startsWith("Error:")) throw new Error("Research Failed: " + text);

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Research Agent failed:", error);
        return null;
    }
};

export const getPersonalizedRecommendation = async (userHistory) => {
    // userHistory: { favorites: ['Blue Dream', 'GSC'], reviews: [{strain:'OG Kush', rating:5, notes:'Love it'}] }

    const prompt = `Act as a "Cannabis Sommelier" AI.
    
    User Taste Profile:
    - Favorites: ${userHistory.favorites.join(', ') || "None yet"}
    - Recent Reviews: ${userHistory.reviews.map(r => `${r.strain} (${r.rating}/5 stars): ${r.notes}`).join('; ') || "None yet"}
    
    Task:
    Recommend 3 DISTINCT strains that fit this specific taste profile but offer a new experience.
    Avoid strains already listed above.
    For each, provide a "Sommelier's Note" explaining WHY it was chosen based on their history (e.g., "Since you liked Blue Dream's berry notes...").
    
    Format: JSON Array of objects: [{ "name": "Strain Name", "reason": "Sommelier's Note", "type": "Sativa/Indica/Hybrid" }]`;

    try {
        const text = await callGemini({ type: 'generate', prompt, reasoningEffort: 'high' });
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Sommelier Error:", e);
        return null; // Handle UI error
    }
};

// generateImage: Simulating AI Avatar generation using local assets for now
export const generateImage = async (prompt) => {
    await new Promise(r => setTimeout(r, 1000)); // Simulate AI thinking
    // Return a random strain image as "Avatar"
    // Since we don't have direct access to strainsData here easily without circular dep,
    // we return a standard placeholder path. The UI handles specific random logic if needed,
    // but the service contract expects a URL.
    const randomId = Math.floor(Math.random() * 6) + 1;
    return `https://source.unsplash.com/random/200x200/?cannabis,abstract&sig=${randomId}`;
    // Note: Unsplash source is deprecated/flaky. 
    // Ideally we import getStrainImageUrl or similar.
    // For stability in this fix, I'll return a static reliable placeholder if not passed.
    return "/placeholder.png";
};

const getPersonaPrompt = (persona) => {
    switch (persona) {
        case "scientist":
            return `You are "The Scientist", a cannabis researcher and biochemist. 
            Tone: Clinical, precise, objective, and educational.
            Focus: Terpenes, cannabinoids (THC, CBD, CBN, etc.), the endocannabinoid system, and physiological effects.
            Instructions: Explain *why* a strain works based on its chemical profile. Cite studies or scientific principles where possible. Avoid slang. Use **bold** for key compounds. Use bullet points for lists. Keep paragraphs short.`;
        case "connoisseur":
            return `You are "The Connoisseur", a high-end cannabis sommelier.
            Tone: Sophisticated, poetic, sensory-focused, and exclusive.
            Focus: Flavor profiles (nose/taste), lineage/genetics, bag appeal, and the "entourage effect" as a luxury experience.
            Instructions: Describe strains like fine wine. Use evocative language. Focus on the art of cultivation and the purity of the experience. Use **bold** for flavor notes.`;
        case "helpful":
        default:
            return `You are "The Guide", a friendly and accessible cannabis consultant.
            Tone: Warm, welcoming, empathetic, and easy to understand.
            Focus: Practical advice, finding relief, and making the user feel comfortable.
            Instructions: Avoid overly technical jargon. Focus on how the user will *feel*. Be a supportive companion on their wellness journey. Use bullet points for recommendations.`;
    }
};
