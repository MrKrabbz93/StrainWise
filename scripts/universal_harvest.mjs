import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

// CONFIGURATION
const RATE_LIMIT_DELAY = 10000; // 10 seconds between writes (10 RPM limit safe zone)
const MAX_RETRIES = 5;

// INITIALIZATION
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const tavilyKey = process.env.TAVILY_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey || !tavilyKey) {
    console.error("❌ MISSING KEYS: Ensure all .env keys are set.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// 📚 THE UNIVERSAL ARCHIVE QUERY LIST
// Covering history, genetics, regions, and eras.
const CATEGORIES = {
    "Landrace & Origins": [
        "best landrace cannabis strains list",
        "original thai strains",
        "afghani landrace strains",
        "colombian gold phenotypes",
        "original acapulco gold variants",
        "hindu kush landrace profile",
        "durban poison original genetics",
        "malawi cob original strains"
    ],
    "The Classics (70s-90s)": [
        "top cannabis strains of the 1970s",
        "best weed strains 1980s",
        "famous 90s strains list",
        "skunk #1 original history",
        "northern lights phenotypes",
        "original white widow history",
        "super silver haze genetics",
        "jack herer strain history"
    ],
    "The Kush Era (2000s)": [
        "top cannabis strains 2000s pipeline",
        "og kush phenotypes list",
        "bubba kush variants",
        "granddaddy purple history"
    ],
    "The Cookie/Cake Era (2010s)": [
        "girl scout cookies phenotypes list",
        "gelato strain variations #33 #41 #45",
        "zkittlez crosses list",
        "wedding cake strain genetics",
        "runtz strain different cuts"
    ],
    "Modern Exotics (2020s)": [
        "top exotic strains 2023",
        "best cannabis strains 2024",
        "compound genetics best strains list",
        "seed junky genetics list"
    ],
    "Alphabetical (Deep Sweep)": [
        "list of cannabis strains starting with A",
        "list of cannabis strains starting with B",
        "list of cannabis strains starting with C",
        "rare cannabis strains starting with Z"
    ]
};

// UTILS
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function retryWrap(fn, name) {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            return await fn();
        } catch (error) {
            if (error.status === 429 || error.message.includes('429')) {
                const waitTime = (Math.pow(2, retries) * 10000) + Math.random() * 1000;
                console.warn(`⏳ Rate Limited (${name}). Waiting ${Math.floor(waitTime / 1000)}s...`);
                await sleep(waitTime);
                retries++;
            } else {
                throw error;
            }
        }
    }
    return null;
}

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
                max_results: 15 // Deep search
            })
        });
        const data = await response.json();
        return data.results || [];
    } catch (e) {
        console.error("Search failed:", e.message);
        return [];
    }
}

async function extractStrainNames(searchResults) {
    const context = JSON.stringify(searchResults.map(r => ({ title: r.title, content: r.content })));

    // We split this into a prompt that demands a LARGE list
    const prompt = `
    Analyze these search results about specific cannabis strains:
    ${context}

    Extract EVERY SINGLE specific strain name mentioned.
    Be aggressive. Include variants (e.g., "Gelato #33" and "Gelato #41" are separate).
    Ignore generic terms mostly, but keep specific landraces (e.g. "Thai Stick").
    
    Return strictly a JSON Array of strings. Example: ["Strain A", "Strain B"]
    `;

    return await retryWrap(async () => {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    }, "Extraction");
}

async function searchStrainImage(strainName) {
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: tavilyKey,
                query: `${strainName} cannabis strain bud close up photo high quality`,
                search_depth: "basic",
                include_images: true,
                max_results: 1
            })
        });
        const data = await response.json();
        return data.images?.[0] || null;
    } catch (e) {
        return null;
    }
}

async function deepResearchStrain(strainName, imageUrl) {
    console.log(`🧬 [GEMINI] Deep Researching: "${strainName}"...`);

    const prompt = `
    Create a comprehensive Encyclopedia Entry for the cannabis strain: "${strainName}".
    Search your internal knowledge base. You are the world's foremost authority on cannabis genetics.

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
        "image_url": "${imageUrl || ''}",
        "is_verified": true
    }
    `;

    return await retryWrap(async () => {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    }, "Research");
}

// MAIN LOOP
async function main() {
    console.log("🌌 INITIATING UNIVERSAL STRAIN ARCHIVE PROTOCOL 🌌");

    // 1. Fetch Existing
    const { data: existing } = await supabase.from('strains').select('name');
    const existingSet = new Set(existing?.map(e => e.name.toLowerCase()) || []);
    console.log(`📚 Knowledge Base Size: ${existingSet.size} strains.`);

    for (const [category, queries] of Object.entries(CATEGORIES)) {
        console.log(`\n📂 PROCESSING CATEGORY: ${category.toUpperCase()}`);

        for (const query of queries) {
            // A. Search
            const results = await searchWeb(query);
            await sleep(2000);

            // B. Extract
            const candidates = await extractStrainNames(results);
            if (!candidates) continue;

            console.log(`Found ${candidates.length} candidates from "${query}".`);

            // C. Filter
            const newCandidates = candidates.filter(name => !existingSet.has(name.toLowerCase()));
            console.log(`New unique strains: ${newCandidates.length}`);

            // D. Research & Archive
            for (const strainName of newCandidates) {
                await sleep(RATE_LIMIT_DELAY);

                // 1. Find Image
                const imageUrl = await searchStrainImage(strainName);
                if (imageUrl) console.log(`   📸 Image found: ${imageUrl.substring(0, 40)}...`);

                // 2. Research Data
                const strainData = await deepResearchStrain(strainName, imageUrl);

                if (strainData) {
                    const { error } = await supabase.from('strains').insert([strainData]);
                    if (error) {
                        console.error(`❌ Error (${strainName}):`, error.message);
                    } else {
                        console.log(`✅ ARCHIVED: ${strainName} [${category}]`);
                        existingSet.add(strainName.toLowerCase());
                    }
                }
            }
        }
    }

    console.log("-----------------------------------------");
    console.log("🎉 UNIVERSAL ARCHIVE COMPLETE.");
}

main();
