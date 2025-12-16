import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

// --- CONFIGURATION ---
const DEEP_SEARCH_MODE = true; // Use multiple queries per city
const DELAY_MS = 2000;

// Target Locations
const LOCATIONS = [
    { country: "Australia", cities: ["Perth", "Sydney", "Melbourne", "Brisbane", "Adelaide", "Gold Coast", "Canberra", "Hobart"] },
    { country: "New Zealand", cities: ["Auckland", "Wellington", "Christchurch"] },
    { country: "United Kingdom", cities: ["London", "Manchester", "Birmingham"] }, // Clinics
    { country: "Germany", cities: ["Berlin", "Munich", "Frankfurt", "Hamburg"] }, // Apotheken
    { country: "Thailand", cities: ["Bangkok", "Chiang Mai", "Phuket"] }, // Dispensaries
    { country: "Canada", cities: ["Toronto", "Vancouver", "Montreal", "Calgary"] },
];

// Search Variations to ensure Deep Coverage
const QUERY_TEMPLATES = [
    (city, country) => `medical cannabis dispensaries in ${city} ${country}`,
    (city, country) => `best cannabis clinics ${city} ${country} reviews`,
    (city, country) => `medicinal marijuana pharmacy ${city} ${country} list`,
    (city, country) => `authorized prescriber prescribers cannabis ${city} ${country}`
];

// --- SETUP ---
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const tavilyKey = process.env.TAVILY_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey || !tavilyKey) {
    console.error("❌ KEY ERROR: Check .env files.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// --- FUNCTIONS ---

async function searchTavily(query) {
    console.log(`\n🔎 Digging: "${query}"...`);
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: tavilyKey,
                query: query,
                search_depth: "advanced",
                include_answer: true,
                max_results: 12 // Get a good chunk per query
            })
        });
        const data = await response.json();
        return data.results || [];
    } catch (e) {
        console.error("Tavily Error:", e.message);
        return [];
    }
}

async function extractDispensaries(searchResults, city, country) {
    if (!searchResults || searchResults.length === 0) return [];

    const context = JSON.stringify(searchResults.map(r => ({ title: r.title, content: r.content, url: r.url })));

    // Prompt designed to be aggressive about finding entities
    const prompt = `
    You are a Data Scraper. Analyze these search results for Cannabis Dispensaries/Clinics in ${city}, ${country}.
    Results: ${context}

    Task: Extract a COMPREHENSIVE list of PHYSICAL locations (Clinics, Dispensaries, Pharmacies).
    - Include strictly "Medical" focused ones for AU/NZ/UK/DE.
    - Include "Dispensaries" for Canada/Thailand.
    - Try to find addresses and phone numbers if mentioned in snippets.
    - DEDUPLICATE logically based on names.

    Return JSON:
    {
        "dispensaries": [
            {
                "name": "Official Name",
                "address": "Full Address (or City, State if vague)",
                "website": "URL (best guess from source)",
                "phone": "+Phone (if available)",
                "type": "Dispensary/Clinic/Pharmacy"
            }
        ]
    }
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" }
        });
        const parsed = JSON.parse(completion.choices[0].message.content);
        return parsed.dispensaries || [];
    } catch (e) {
        console.error("AI Extraction Error:", e.message);
        return [];
    }
}

async function processCity(city, country) {
    console.log(`\n📍 PROCESSING: ${city}, ${country.toUpperCase()}`);

    // 1. Gather raw results from ALL query variations
    let allRawResults = [];

    // If Deep Mode, run all queries. If not, just the first one.
    const queriesToRun = DEEP_SEARCH_MODE ? QUERY_TEMPLATES : [QUERY_TEMPLATES[0]];

    for (const tmpl of queriesToRun) {
        const q = tmpl(city, country);
        const results = await searchTavily(q);
        allRawResults = [...allRawResults, ...results];
        await sleep(1000); // Friendly rate limit
    }

    // 2. Extract with AI (Batch processing the mass of text)
    // If too large, we might need to chunk? For now, sending ~40 snippets to GPT-4o-mini is mostly fine (128k context).
    // Let's slice to top 30 unique URLs to be safe and efficient.
    const uniqueResults = [];
    const seenUrls = new Set();
    allRawResults.forEach(r => {
        if (!seenUrls.has(r.url)) {
            seenUrls.add(r.url);
            uniqueResults.push(r);
        }
    });

    console.log(`   📝 Analyzing ${uniqueResults.length} unique search snippets...`);
    const extractedList = await extractDispensaries(uniqueResults.slice(0, 40), city, country);
    console.log(`   💡 AI identified ${extractedList.length} locations.`);

    // 3. Save to DB
    for (const d of extractedList) {
        // Basic cleanup
        if (!d.name || d.name.toLowerCase().includes("best dispensaries in")) continue;

        const row = {
            name: d.name,
            country: country,
            region: city, // Storing city in region col for now, or city col if schema matches
            city: city,
            address: d.address || `${city}, ${country}`,
            website: d.website,
            phone: d.phone,
            rating: null // We don't have ratings from this easily
        };

        const { error } = await supabase
            .from('dispensaries')
            .upsert(row, { onConflict: 'name, address', ignoreDuplicates: true });

        if (error) {
            // console.error(`   ❌ DB Error: ${error.message}`);
        } else {
            console.log(`   ✅ Saved: ${d.name} (${d.type || 'Location'})`);
        }
    }
}

async function main() {
    console.log("🌍 STARTING GLOBAL DISPENSARY DEEP SEARCH 🌍");

    for (const loc of LOCATIONS) {
        console.log(`\n--- Starting Country: ${loc.country} ---`);
        for (const city of loc.cities) {
            await processCity(city, loc.country);
            await sleep(DELAY_MS);
        }
    }
    console.log("\n🏁 GLOBAL SEARCH COMPLETE.");
}

main();
