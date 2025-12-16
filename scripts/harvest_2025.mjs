import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

// CONFIGURATION
const SEARCH_DEPTH = 3; // How many pages/queries to run
const BATCH_SIZE = 5;   // Concurrency for Deep Research
const DELAY_MS = 2000;  // Respect Rate Limits

// INITIALIZATION
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const tavilyKey = process.env.TAVILY_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey || !tavilyKey) {
    console.error("❌ MISSING KEYS: Ensure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, and TAVILY_API_KEY are set in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

// TARGET QUERIES FOR 2025-2026
const QUERIES = [
    // Local / Location Specific (User Request Priority)
    "Perth Western Australia cannabis strains dispensary menu",
    "Catalyst Dispensary Perth menu",
    "Cannabis Botanical Perth stock list",
    "Australian medical cannabis strains 2025 reviews",
    "popular medical cannabis strains Australia Reddit",
    // Global Trends
    "best new cannabis strains 2025",
    "top exotic weed strains 2025 drops",
    "upcoming cannabis genetics 2026",
    "Compound Genetics new drops 2025 reviews",
    "Seed Junky Genetics 2025 release list",
    "Jungle Boys new strains 2025",
    "High Times Cannabis Cup winners 2024 2025 list",
    "trending terpenes 2025 cannabis market",
    "rarest grower exclusive strains 2025",
    // Local / Location Specific
    "Perth Western Australia cannabis strains dispensary menu",
    "Catalyst Dispensary Perth menu",
    "Cannabis Botanical Perth stock list",
    "Australian medical cannabis strains 2025 reviews",
    "popular medical cannabis strains Australia Reddit"
];

// UTILS
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function searchWeb(query) {
    console.log(`\n🔎 [TAVILY] Searching: "${query}"...`);
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: tavilyKey,
                query: query,
                search_depth: "advanced",
                include_answer: true,
                max_results: 10
            })
        });
        const data = await response.json();
        return data.results || [];
    } catch (e) {
        console.error("Search failed:", e);
        return [];
    }
}

async function extractStrainNames(searchResults) {
    const context = JSON.stringify(searchResults.map(r => ({ title: r.title, content: r.content })));
    const prompt = `
    Analyze these search results about 2025/2026 cannabis trends:
    ${context}

    Extract a list of specific STRAIN NAMES that are mentioned as new, popular, or upcoming.
    Ignore generic terms (like "OG Kush" or "Gelato" unless it's a specific new cross).
    Focus on "Exotics", "Drops", and specific Breeder cuts.
    
    Return strictly a JSON Array of strings. Example: ["Super Boof", "Zoap", "Permanent Marker"]
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
        });
        const content = completion.choices[0].message.content;
        const parsed = JSON.parse(content);
        // Handle various JSON wrapper keys OpenAI might invent
        return parsed.strains || parsed.names || (Array.isArray(parsed) ? parsed : []);
    } catch (e) {
        console.error("Extraction failed:", e.message);
        // Fallback parsing try
        try {
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt + " RETURN ONLY A JSON ARRAY." }],
                model: "gpt-4o-mini"
            });
            const text = completion.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
            if (text.startsWith('[')) return JSON.parse(text);
            return [];
        } catch (retryErr) {
            return [];
        }
    }
}

async function deepResearchStrain(strainName) {
    console.log(`🧬 [OPENAI] Deep Researching: "${strainName}"...`);

    const prompt = `
    Conduct a "Deep Web Research" for the 2025/2026 cannabis strain: "${strainName}".
    You are a Master Geneticist. Use your internal knowledge and search grounding.

    Output STRICT JSON for the 'strains' table schema:
    {
        "name": "${strainName}",
        "description": "2-3 sentences. Sommelier tone. History, breeder, sensory profile.",
        "type": "Indica/Sativa/Hybrid (be specific)",
        "thc": "e.g. 26-32%",
        "lineage": "Parent A x Parent B",
        "terpenes": ["Terp1", "Terp2", "Terp3"],
        "effects": ["Effect1", "Effect2", "Effect3"],
        "medical": ["Use1", "Use2", "Use3"],
        "growing": "Difficulty, Flowering Time",
        "visual_profile": "Choose ONE: ['purple', 'green_sativa', 'frosty', 'orange', 'dark']",
        "is_verified": true
    }
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" }
        });
        return JSON.parse(completion.choices[0].message.content);
    } catch (e) {
        console.error(`Research failed for ${strainName}:`, e.message);
        return null;
    }
}

// MAIN LOOP
async function main() {
    console.log("🚀 STARTING GLOBAL STRAIN HARVEST [2025-2026] 🚀");

    // 1. Fetch Existing to avoid duplicates
    const { data: existing } = await supabase.from('strains').select('name');
    const existingSet = new Set(existing?.map(e => e.name.toLowerCase()) || []);
    console.log(`📚 Database currently holds ${existingSet.size} strains.`);

    for (const query of QUERIES) {
        // Step A: Search High-Level
        const results = await searchWeb(query);
        await sleep(1000);

        // Step B: Extract Candidates
        const candidates = await extractStrainNames(results);
        console.log(`Found ${candidates.length} potential candidates from query.`);

        // Step C: Filter
        const newCandidates = candidates.filter(name => !existingSet.has(name.toLowerCase()));
        console.log(`New unique strains to process: ${newCandidates.length}`);

        // Step D: Batch Process
        for (const strainName of newCandidates) {
            // Rate Limit Guard (Increased to 10s to avoid 429 Quota Exceeded)
            await sleep(10000);

            // Research
            const strainData = await deepResearchStrain(strainName);

            if (strainData) {
                // Insert
                const { error } = await supabase.from('strains').insert([strainData]);
                if (error) {
                    console.error(`❌ Failed to insert ${strainName}:`, error.message);
                } else {
                    console.log(`✅ INDEXED: ${strainName} (${strainData.type})`);
                    existingSet.add(strainName.toLowerCase()); // Add to local cache
                }
            }
        }
    }

    console.log("-----------------------------------------");
    console.log("🎉 GLOBAL HARVEST COMPLETE.");
}

main();
