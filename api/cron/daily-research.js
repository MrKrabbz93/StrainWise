import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    console.log("🚀 Daily Research Agent (Google Grounding) Starting...");

    // Initialize Credentials
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseKey || !geminiKey) {
        console.error("Missing Secrets: Check SUPABASE_SERVICE_ROLE_KEY and GEMINI_API_KEY");
        return res.status(500).json({ error: "Missing Server-Side Credentials" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const genAI = new GoogleGenerativeAI(geminiKey);
    // Use the model that supports search grounding
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        tools: [{ googleSearch: {} }]
    });

    try {
        // 1. Get existing strains to avoid duplicates
        const { data: existingData, error: fetchError } = await supabase
            .from('strains')
            .select('name');

        if (fetchError) throw fetchError;
        const existingNames = new Set(existingData.map(e => e.name.toLowerCase()));

        // Sample for exclusion prompt
        const excludeList = Array.from(existingNames).slice(0, 50).join(', ');

        // 2. RESEARCH & SYNTHESIS PHASE
        // We ask Gemini to use Google Search to find a "New" strain and immediately format it for our DB.
        const prompt = `
        Perform a Deep Web Search to find a new, trending, or exotic cannabis strain released or popularized in late 2024 or 2025.
        
        Constraints:
        1. MUST be a real, specific strain (verify via search results).
        2. IGNORE these existing strains: ${excludeList}... (and other common ones).
        3. IGNORE generic names like "Kush" or "Haze" without a specific prefix/suffix.
        
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

        console.log("🤖 Agent consulting the Oracle (Google Search)...");

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });
        const responseText = result.response.text();

        console.log("📝 Agent Response received.");

        // Robust JSON Extraction
        // Sometimes Gemini outputs multiple JSONs or chatty text. We extract the first valid balanced JSON object.
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

        const jsonStr = extractFirstJson(responseText);
        if (!jsonStr) throw new Error("No JSON found in response");

        let candidate;
        try {
            candidate = JSON.parse(jsonStr);
        } catch (e) {
            console.error("JSON Parse Error on extracted string:", jsonStr);
            throw new Error("Failed to parse extracted JSON");
        }

        // 3. VALIDATION
        if (!candidate.name) throw new Error("Agent returned no name.");

        if (existingNames.has(candidate.name.toLowerCase())) {
            console.log(`⚠️ Duplicate Detected: '${candidate.name}' already exists.`);
            return res.status(200).json({ message: "No new strains found (duplicate generated).", candidate: candidate.name });
        }

        console.log(`🌱 Discovered New Candidate: ${candidate.name} (Source: ${candidate.source_url})`);

        // 4. INSERT PHASE
        const { error: insertError } = await supabase
            .from('strains')
            .insert([candidate]);

        if (insertError) throw insertError;

        return res.status(200).json({
            success: true,
            message: `Harvested and Added: ${candidate.name}`,
            data: candidate
        });

    } catch (error) {
        console.error("Agent Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
