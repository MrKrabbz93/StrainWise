import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fetch from 'node-fetch';

import dotenv from 'dotenv';
import pg from 'pg';
const { Client } = pg;

dotenv.config();

// CONFIGURATION
const REGIONS = [
    { city: "Perth", state: "WA" },
    { city: "Adelaide", state: "SA" },
    { city: "Melbourne", state: "VIC" },
    { city: "Sydney", state: "NSW" },
    { city: "Brisbane", state: "QLD" },
    { city: "Hobart", state: "TAS" },
    { city: "Canberra", state: "ACT" },
    { city: "Darwin", state: "NT" }
];

const DELAY_MS = 3000;

// KEYS
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const tavilyKey = process.env.TAVILY_API_KEY;
const dbUrl = process.env.DATABASE_URL; // For creating table if missing

if (!supabaseUrl || !supabaseKey || !openaiKey || !tavilyKey) {
    console.error("❌ MISSING KEYS: Check .env for SUPABASE_*, OPENAI_API_KEY, TAVILY_API_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

// UTILS
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function ensureTableExists() {
    if (!dbUrl) {
        console.warn("⚠️ DATABASE_URL not found. Skipping table creation check (hope it exists!).");
        return;
    }
    const client = new Client({ connectionString: dbUrl });
    try {
        await client.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.dispensaries (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                name text NOT NULL,
                region text,
                city text,
                address text,
                website text,
                phone text,
                rating numeric,
                created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
                CONSTRAINT dispensaries_name_addr_key UNIQUE (name, address)
            );
            ALTER TABLE public.dispensaries ENABLE ROW LEVEL SECURITY;
            -- Loose policy for dev
            DROP POLICY IF EXISTS "Enable read access for all users" ON public.dispensaries;
            CREATE POLICY "Enable read access for all users" ON public.dispensaries FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Enable insert for service role only" ON public.dispensaries;
            CREATE POLICY "Enable insert for service role only" ON public.dispensaries FOR INSERT WITH CHECK (true);
        `);
        console.log("✅ 'dispensaries' table verified/created.");
    } catch (e) {
        console.error("⚠️ Failed to init table via PG client:", e.message);
    } finally {
        await client.end();
    }
}

async function searchDispensaries(city, state) {
    const query = `medical cannabis dispensaries in ${city} ${state} Australia`;
    console.log(`\n🔎 Searching: "${query}"...`);

    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: tavilyKey,
                query: query,
                search_depth: "advanced",
                include_answer: true,
                max_results: 15
            })
        });
        const data = await response.json();
        return data.results || [];
    } catch (e) {
        console.error("Search failed:", e.message);
        return [];
    }
}

async function extractDispensaryData(results, city, state) {
    const context = JSON.stringify(results.map(r => ({ title: r.title, content: r.content, url: r.url })));
    const prompt = `
    Analyze these search results for Cannabis Dispensaries in ${city}, ${state}, Australia.
    Results: ${context}

    Extract a generic JSON list of ACTUAL medical cannabis dispensaries or pharmacies known for cannabis.
    Ignore news articles or general info pages unless they list a specific clinic/pharmacy.
    
    Format:
    {
        "dispensaries": [
            {
                "name": "Exact Name",
                "address": "Street Address (estimate if needed)",
                "website": "URL",
                "phone": "Phone or null",
                "rating": 4.5 (estimate or null)
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
        console.error("Extraction failed:", e.message);
        return [];
    }
}

async function main() {
    console.log("🚀 STARTING AUSTRALIAN DISPENSARY CENSUS 🇦🇺");
    await ensureTableExists();

    for (const region of REGIONS) {
        console.log(`\n📍 Processing ${region.city}, ${region.state}...`);

        // 1. Search
        const searchResults = await searchDispensaries(region.city, region.state);
        await sleep(1000);

        // 2. Extract
        if (searchResults.length > 0) {
            const foundDispensaries = await extractDispensaryData(searchResults, region.city, region.state);
            console.log(`   Found ${foundDispensaries.length} candidates.`);

            // 3. Save
            for (const d of foundDispensaries) {
                const row = {
                    name: d.name,
                    city: region.city,
                    region: region.state,
                    address: d.address || `${region.city}, ${region.state}`,
                    website: d.website,
                    phone: d.phone,
                    rating: d.rating
                };

                const { error } = await supabase
                    .from('dispensaries')
                    .upsert(row, { onConflict: 'name, address', ignoreDuplicates: true });

                if (error) {
                    // Ignore duplicates silently-ish
                    if (!error.message.includes("duplicate key")) {
                        console.error(`   ❌ Error saving ${d.name}:`, error.message);
                    }
                } else {
                    console.log(`   ✅ Saved: ${d.name}`);
                }
            }
        } else {
            console.log("   No results found.");
        }

        await sleep(DELAY_MS);
    }

    console.log("\n🎉 CENSUS COMPLETE.");
}

main();
