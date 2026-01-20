import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup ES module paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(ROOT_DIR, '.env') });
if (fs.existsSync(path.join(ROOT_DIR, '.env.marketing'))) {
    dotenv.config({ path: path.join(ROOT_DIR, '.env.marketing'), override: true });
}

// Config
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY; // Need Service Key to delete sometimes

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase Credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deduplicate() {
    console.log("🧹 Starting Dispensary Deduplication...");

    // 1. Fetch All
    const { data: dispensaries, error } = await supabase
        .from('dispensaries')
        .select('id, name, address, city, country, created_at')
        .order('created_at', { ascending: true }); // Keep oldest? Or newest? Usually keep oldest ID to preserve refs, but maybe newest has better data? I'll keep oldest.

    if (error) {
        console.error("Error fetching data:", error.message);
        return;
    }

    console.log(`📊 Total records found: ${dispensaries.length}`);

    const uniqueMap = new Map();
    const toDeleteIds = [];

    // 2. Identify Duplicates
    for (const d of dispensaries) {
        // Normalize Key: "name|address" (simplified)
        // Better: normalize regex
        const cleanName = d.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        const cleanAddress = (d.address || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '').slice(0, 10); // First 10 chars of address to be loose

        // If exact address isn't robust, maybe just match Name + City?
        // Let's rely on Name + City for now as the harvest script iterates cities.
        const cleanCity = (d.city || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

        // Key: country + city + normalized_name
        const key = `${d.country}|${cleanCity}|${cleanName}`;

        if (uniqueMap.has(key)) {
            // Found duplicate
            console.log(`   🗑️ Duplicate found: "${d.name}" (${d.city}). Marking ID ${d.id} for deletion.`);
            toDeleteIds.push(d.id);
        } else {
            uniqueMap.set(key, d);
        }
    }

    if (toDeleteIds.length === 0) {
        console.log("✅ No duplicates found.");
        return;
    }

    console.log(`🔥 Deleting ${toDeleteIds.length} duplicates...`);

    // 3. Delete
    const { error: deleteError } = await supabase
        .from('dispensaries')
        .delete()
        .in('id', toDeleteIds);

    if (deleteError) {
        console.error("❌ Delete failed:", deleteError.message);
    } else {
        console.log("✅ Cleanup complete.");
    }
}

deduplicate();
