import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase configuration.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restore() {
    console.log("📂 Loading strains.json...");
    const dataPath = path.resolve(__dirname, '../src/data/strains.json');
    if (!fs.existsSync(dataPath)) {
        console.error("❌ strains.json not found at", dataPath);
        return;
    }

    const strains = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`✨ Found ${strains.length} strains. Preparing for ingestion...`);

    // Clean data for Supabase (remove IDs if they conflict, ensure types match)
    const formattedStrains = strains.map(s => ({
        name: s.name,
        type: s.type,
        aroma: s.aroma,
        effects: s.effects,
        medical_uses: s.medical_uses,
        thc: s.thc,
        cbd: s.cbd,
        lineage: s.lineage,
        image_url: s.image_url,
        description: s.description,
        terpenes: s.terpenes || [],
        flavors: s.flavors || []
    }));

    console.log("🚀 Upserting strains to Supabase...");

    // Batching to prevent timeout
    const BATCH_SIZE = 100;
    for (let i = 0; i < formattedStrains.length; i += BATCH_SIZE) {
        const batch = formattedStrains.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('strains').upsert(batch, { onConflict: 'name' });
        if (error) {
            console.error(`❌ Error in batch ${i / BATCH_SIZE + 1}:`, error.message);
        } else {
            console.log(`✅ Ingested batch ${i / BATCH_SIZE + 1}/${Math.ceil(formattedStrains.length / BATCH_SIZE)}`);
        }
    }

    console.log("🏁 Restoration Complete.");
}

restore();
