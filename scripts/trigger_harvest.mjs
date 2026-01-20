import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("🚀 Manual Harvest Trigger Starting...");

async function runHarvest() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseKey || !geminiKey) {
        console.error("❌ Missing Credentials. Ensure SUPABASE_SERVICE_ROLE_KEY and GEMINI_API_KEY are in .env");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        tools: [{ googleSearch: {} }]
    });

    try {
        // 1. Get existing strains
        console.log("🔍 Checking existing strains...");
        const { data: existingData, error: fetchError } = await supabase
            .from('strains')
            .select('name');

        if (fetchError) throw fetchError;
        const existingNames = new Set(existingData.map(e => e.name.toLowerCase()));
        const excludeList = Array.from(existingNames).slice(0, 50).join(', ');

        // 2. Prompt
        const prompt = `
        Perform a Deep Web Search to find a new, trending, or exotic cannabis strain released or popularized in late 2024 or 2025.
        
        Constraints:
        1. MUST be a real, specific strain (verify via search results).
        2. IGNORE these existing strains: ${excludeList}...
        
        Task:
        Identify ONE high-confidence candidate.
        Extract all necessary details to build a complete database profile.
        
        Return STRICT JSON format:
        {
            "name": "Strain Name",
            "description": "2-3 sentences describing lineage, breeder, and sensory experience.",
            "type": "Indica / Sativa / Hybrid",
            "thc": 25,
            "terpenes": ["Myrcene", "Limonene"],
            "effects": ["Relaxed", "Euphoric"],
            "medical": ["Anxiety", "Pain"],
            "lineage": "Parent A x Parent B",
            "growing": "Difficulty: Easy, flowering...",
            "visual_profile": "One of: [purple, green_sativa, frosty, orange, dark]",
            "is_verified": true,
            "source_url": "URL of the review or breeder page used as source"
        }
        `;

        console.log("🤖 Consulting Gemini with Search Grounding...");
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        // Robust JSON Extraction
        const extractFirstJson = (text) => {
            const start = text.indexOf('{');
            if (start === -1) return null;
            let balance = 0;
            for (let i = start; i < text.length; i++) {
                if (text[i] === '{') balance++;
                else if (text[i] === '}') balance--;
                if (balance === 0) return text.substring(start, i + 1);
            }
            return null;
        };

        const responseText = result.response.text();
        const jsonStr = extractFirstJson(responseText);
        if (!jsonStr) throw new Error("No JSON found in response");

        const candidate = JSON.parse(jsonStr);

        console.log(`✨ Discovered: ${candidate.name}`);
        console.log(`📖 Description: ${candidate.description}`);
        console.log(`🔗 Source: ${candidate.source_url}`);

        // 3. Insert
        console.log("📤 Inserting into database...");
        const { error: insertError } = await supabase
            .from('strains')
            .insert([candidate]);

        if (insertError) throw insertError;

        console.log("✅ Harvest Successful!");
    } catch (error) {
        console.error("❌ Harvest Failed:", error.message);
    }
}

runHarvest();
