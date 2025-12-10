import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    console.log("🚀 Daily Research Agent Starting...");

    // Initialize Supabase (Use Service Role if available for admin rights, else Anon)
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Missing Supabase Credentials" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize Gemini
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "Missing Gemini API Key" });
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the smart model for research
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    try {
        // 1. Get a snapshot of current strains to avoid redundancy
        const { data: existingData, error: fetchError } = await supabase
            .from('strains')
            .select('name')
            .limit(1000);

        if (fetchError) throw fetchError;

        const existingNames = existingData.map(e => e.name);

        // 2. Ask Gemini for 1 new trending strain
        // We ask for just 1 to be conservative with limits for now
        const discoveryPrompt = `You are a Cannabis Trend Hunter. 
        Identify 1 popular, classic, or trending cannabis strain that is NOT in this list: ${JSON.stringify(existingNames.slice(0, 100))}.
        Return ONLY the strain name as a plain string. Do not use quotes or markdown.`;

        const discoveryResult = await model.generateContent(discoveryPrompt);
        const strainName = discoveryResult.response.text().trim().replace(/['"`]/g, '');

        if (!strainName || existingNames.includes(strainName)) {
            return res.status(200).json({ message: "No new strains found to add." });
        }

        console.log(`🔎 Researching new strain: ${strainName}`);

        // 3. Deep Research (Simulated Google Grounding via Prompt)
        // Note: For server-side simplicity without complex tool handling, we use a strong system prompt.
        const researchPrompt = `Perform a deep research profile for the strain "${strainName}".
        Return a valid JSON object with these keys: 
        { "name": "${strainName}", "description": "...", "lineage": "...", "type": "...", "thc": "...", "terpenes": [], "effects": [], "medical": [], "growing": "...", "visual_profile": "green_sativa", "fun_fact": "..." }
        Ensure "visual_profile" is one of: ["purple", "green_sativa", "frosty", "orange", "dark"].`;

        const researchResult = await model.generateContent(researchPrompt);
        const researchText = researchResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        let strainData;
        try {
            strainData = JSON.parse(researchText);
        } catch (e) {
            console.error("JSON Parse Failed", researchText);
            throw new Error("Failed to parse research data");
        }

        // 4. Save to Database
        const { error: insertError } = await supabase
            .from('strains')
            .insert([strainData]);

        if (insertError) {
            // Handle RLS error: If Anon key is used and RLS blocks it
            if (insertError.code === '42501') {
                return res.status(403).json({ error: "Permission Denied: Service Role Key needed for Cron Job to bypass RLS." });
            }
            throw insertError;
        }

        return res.status(200).json({
            success: true,
            message: `Added ${strainName} to the Lab.`,
            data: strainData
        });

    } catch (error) {
        console.error("Cron Job Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
