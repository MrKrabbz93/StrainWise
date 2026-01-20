import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Stats Error: Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateReport() {
    console.log("📊 Generating Regional Density Report...");

    // Fetch all dispensaries (lightweight select)
    const { data: dispensaries, error } = await supabase
        .from('dispensaries')
        .select('id, name, country, city, website, phone');

    if (error) {
        console.error("❌ Error fetching data:", error);
        return;
    }

    console.log(`🌿 Total Dispensaries Analyzed: ${dispensaries.length}`);

    // --- 1. Regional Density Analysis ---
    const countryCounts = {};
    const cityCounts = {};

    dispensaries.forEach(d => {
        // Country Stats
        const country = d.country || "Unknown";
        countryCounts[country] = (countryCounts[country] || 0) + 1;

        // City Stats (Keyed by Country for uniqueness)
        const cityKey = `${d.city || 'Unknown'}, ${country}`;
        cityCounts[cityKey] = (cityCounts[cityKey] || 0) + 1;
    });

    // --- 2. Data Quality Audit ---
    let hasWebsite = 0;
    let hasPhone = 0;
    let contactable = 0; // Has either phone OR website

    dispensaries.forEach(d => {
        if (d.website) hasWebsite++;
        if (d.phone) hasPhone++;
        if (d.website || d.phone) contactable++;
    });

    const qualityScore = Math.round((contactable / dispensaries.length) * 100);

    // --- 3. Output Tables ---

    console.log("\n🌍 TOP 5 GROWTH MARKETS (By Country)");
    console.table(
        Object.entries(countryCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([country, count]) => ({ Country: country, Count: count }))
    );

    console.log("\n🏙️ TOP 10 CITIES (High Density Clusters)");
    console.table(
        Object.entries(cityCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([location, count]) => ({ Location: location, Count: count }))
    );

    console.log("\n💎 DATA QUALITY AUDIT");
    console.table([
        { Metric: "Total Listings", Value: dispensaries.length },
        { Metric: "With Website", Value: `${hasWebsite} (${Math.round(hasWebsite / dispensaries.length * 100)}%)` },
        { Metric: "With Phone", Value: `${hasPhone} (${Math.round(hasPhone / dispensaries.length * 100)}%)` },
        { Metric: "Contactable (Lead Gen Ready)", Value: `${contactable} (${qualityScore}%)` }
    ]);

    if (qualityScore < 50) {
        console.log("\n⚠️ INSIGHT: Low data quality. Prioritize 'Enrichment' harvest workflows.");
    } else {
        console.log("\n✅ INSIGHT: High data quality. Ready for B2B outreach campaigns.");
    }
}

generateReport();
