import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

// --- CONFIGURATION ---
const DELAY_MS = 10000;

// Target Locations
const LOCATIONS = [
    { country: "Australia", cities: ["Perth", "Sydney", "Melbourne", "Brisbane", "Adelaide", "Gold Coast", "Canberra", "Hobart"] },
    { country: "New Zealand", cities: ["Auckland", "Wellington", "Christchurch"] },
    { country: "United Kingdom", cities: ["London", "Manchester", "Birmingham"] }, // Clinics
    { country: "Germany", cities: ["Berlin", "Munich", "Frankfurt", "Hamburg"] }, // Apotheken
    { country: "Thailand", cities: ["Bangkok", "Chiang Mai", "Phuket"] }, // Dispensaries
    { country: "Canada", cities: ["Toronto", "Vancouver", "Montreal", "Calgary"] },
];

// --- SETUP ---
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error("❌ KEY ERROR: Check .env files. Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    tools: [{ googleSearch: {} }]
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// --- FUNCTIONS ---

const allDispensaries = [];

async function processCity(city, country) {
    console.log(`\n📍 PROCESSING: ${city}, ${country.toUpperCase()}`);

    const prompt = `
    Find physical medical cannabis dispensaries, clinics, or authorized pharmacies in ${city}, ${country}.
    Use Google Search to find current, operating locations with addresses.
    Task: Extract a list of at least 5-10 verified locations.
    Return strictly JSON format: { "dispensaries": [ { "name": "Official Name", "address": "Full Street Address", "website": "URL", "phone": "Phone", "type": "Dispensary" } ] }
    `;

    try {
        console.log(`   🤖 Agent searching...`);
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const responseText = result.response.text();
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
        if (!jsonStr) throw new Error("No JSON found");

        const data = JSON.parse(jsonStr);
        const list = data.dispensaries || [];

        console.log(`   💡 Found ${list.length} locations.`);

        // Add to collector
        list.forEach(item => {
            item.city = city;
            item.country = country;
            allDispensaries.push(item);
        });

        // Try Save to DB if keys exist
        if (supabase) {
            for (const d of list) {
                if (!d.name) continue;
                const row = {
                    name: d.name,
                    country: country,
                    region: city,
                    city: city,
                    address: d.address || `${city}, ${country}`,
                    website: d.website,
                    phone: d.phone,
                    rating: null
                };
                const { error } = await supabase.from('dispensaries').upsert(row, { onConflict: 'name, address', ignoreDuplicates: true });
                if (!error) console.log(`      ✅ Saved to DB: ${d.name}`);
            }
        }

    } catch (e) {
        console.error(`   ❌ Error processing ${city}:`, e.message);
    }
}

async function main() {
    console.log("🌍 STARTING GLOBAL DISPENSARY DEEP SEARCH (GEMINI POWERED) 🌍");

    for (const loc of LOCATIONS) {
        console.log(`\n--- Starting Country: ${loc.country} ---`);
        for (const city of loc.cities) {
            await processCity(city, loc.country);
            await sleep(DELAY_MS);
        }
    }

    // OUTPUT TO FILE
    const outputPath = 'data/harvested_dispensaries.json';
    import('fs').then(fs => {
        if (!fs.existsSync('data')) fs.mkdirSync('data');
        fs.writeFileSync(outputPath, JSON.stringify(allDispensaries, null, 2));
        console.log(`\n💾 Saved ${allDispensaries.length} records to ${outputPath}`);
    });

    console.log("\n🏁 GLOBAL SEARCH COMPLETE.");
}

main();
