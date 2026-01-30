import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simulateFrontendFetch() {
    console.log("🧪 Simulating Frontend Fetch Logic...");

    try {
        // Exact query from StrainLibrary.jsx
        let queryBuilder = supabase
            .from('strains')
            .select('*');

        // Initial load activeEffect is null, so it shouldn't hit the ilike/contains filters

        queryBuilder = queryBuilder.limit(500);

        const { data, error } = await queryBuilder;

        if (error) {
            console.error("❌ Fetch Error:", error.message);
            if (error.code === '42P01') console.log("HINT: Table 'strains' not found!");
            return;
        }

        if (data) {
            console.log(`✅ Success! Fetched ${data.length} strains.`);
            if (data.length === 0) {
                console.warn("⚠️ Query returned 0 results. Check RLS or table content.");
            } else {
                const first = data[0];
                console.log("First Strain Sample:", {
                    name: first.name,
                    image_url: first.image_url,
                    visual_profile: first.visual_profile
                });
            }
        }
    } catch (err) {
        console.error("🌋 CRASH:", err.message);
    }
}

simulateFrontendFetch();
