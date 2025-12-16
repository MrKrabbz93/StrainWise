import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase Secrets.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectImages() {
    console.log("🔍 Inspecting Harvested Images...");

    // Fetch recent strains with images
    const { data: strains, error } = await supabase
        .from('strains')
        .select('name, image_url')
        .not('image_url', 'is', null) // Only those with images
        .not('image_url', 'eq', '')
        .order('id', { ascending: false }) // Newest first
        .limit(10);

    if (error) {
        console.error("DB Error:", error.message);
        return;
    }

    if (!strains || strains.length === 0) {
        console.log("⚠️ No images found in the database yet.");
    } else {
        console.log(`📸 Found ${strains.length} recent images:\n`);
        strains.forEach(s => {
            console.log(`- [${s.name}] ${s.image_url}`);
        });
    }
}

inspectImages();
