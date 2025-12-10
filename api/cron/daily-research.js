import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    console.log("🚀 Daily Research Agent (Web Scraper) Starting...");

    // Initialize Credentials
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    // CRITICAL: Use Service Role Key for writing to DB without user session
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const tavilyKey = process.env.TAVILY_API_KEY;

    if (!supabaseUrl || !supabaseKey || !geminiKey || !tavilyKey) {
        console.error("Missing Secrets: Check SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, and TAVILY_API_KEY");
        return res.status(500).json({ error: "Missing Server-Side Credentials" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    try {
        // 1. Get existing strains to avoid duplicates
        const { data: existingData, error: fetchError } = await supabase
            .from('strains')
            .select('name');

        if (fetchError) throw fetchError;
        const existingNames = new Set(existingData.map(e => e.name.toLowerCase()));

        // 2. SCRAPE PHASE: Use Tavily to find fresh forum discussions
        // specific query for reddit and forums
        const queries = [
            "new cannabis strain review 2024 site:reddit.com/r/trees OR site:reddit.com/r/cannabis",
            "best new weed strains 2025 discussion forum",
            "latest exotic strains drops reviews"
        ];
        const randomQuery = queries[Math.floor(Math.random() * queries.length)];

        console.log(`🔎 Scraping Web for: "${randomQuery}"...`);

        const searchResponse = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: tavilyKey,
                query: randomQuery,
                search_depth: "advanced", // Get more content
                include_answer: true,
                max_results: 7
            })
        });

        const searchData = await searchResponse.json();
        const context = JSON.stringify(searchData.results);

        // 3. ANALYZE PHASE: Use Gemini to extract ONE valid, new strain from the noise
        const extractionPrompt = `
        Analyze these web search results from cannabis forums/reviews:
        ${context}

        Task: Identify ONE legitimate, real cannabis strain name mentioned that is likely to be a new or specific cultivar.
        
        Constraints:
        1. Ignore these existing strains: ${Array.from(existingNames).slice(0, 50).join(', ')}... (and common ones like Blue Dream, OG Kush).
        2. Must be a specific strain name (e.g., "Permanent Marker", "Zoap", "Super Boof"), not a general category.
        3. Extract the 'source_url' from the search results where this strain is discussed.

        Return JSON ONLY:
        {
            "name": "Strain Name",
            "source_url": "URL where found",
            "confidence": "High/Medium/Low"
        }
        `;

        const extractionResult = await model.generateContent(extractionPrompt);
        const extractionText = extractionResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const candidate = JSON.parse(extractionText);

        if (existingNames.has(candidate.name.toLowerCase())) {
            console.log(`Creation Skipped: '${candidate.name}' already exists.`);
            return res.status(200).json({ message: "No new strains found (duplicate)." });
        }

        console.log(`🌱 Discovered New Candidate: ${candidate.name} (Source: ${candidate.source_url})`);

        // 4. RESEARCH PHASE: Zero-in on this specific candidate to get full schema details
        // We do a second focused Generation for the DB schema
        const detailPrompt = `
        Research Profile for strain: "${candidate.name}".
        Based on general knowledge and reasonable inference for this type of strain name:
        
        Construct a JSON object for the database:
        { 
            "name": "${candidate.name}", 
            "description": "2 sentences describing effects/flavor...", 
            "type": "Indica/Sativa/Hybrid", 
            "thc_level": "e.g. 24-28%", 
            "cbd_level": "e.g. <1%",
            "flavor": "Comma separated flavors",
            "effects": "Comma separated effects",
            "visual_profile": "One of: purple, green_sativa, frosty, orange, dark",
            "is_verified": true,
            "source_url": "${candidate.source_url}"
        }
        `;

        const detailResult = await model.generateContent(detailPrompt);
        const detailText = detailResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const finalStrainData = JSON.parse(detailText);

        // 5. INSERT PHASE
        const { error: insertError } = await supabase
            .from('strains')
            .insert([finalStrainData]);

        if (insertError) throw insertError;

        return res.status(200).json({
            success: true,
            message: `Harvested and Added: ${finalStrainData.name}`,
            source: candidate.source_url,
            data: finalStrainData
        });

    } catch (error) {
        console.error("Agent Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
