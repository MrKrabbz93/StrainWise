import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectStrains() {
    console.log("🔍 Auditing Strains Section...");

    // 1. Check table existence and count
    const { count, error: countError } = await supabase
        .from('strains')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("❌ Error fetching strain count:", countError.message);
    } else {
        console.log(`📊 Total Strains found: ${count}`);
    }

    // 2. Sample data check
    const { data: sample, error: sampleError } = await supabase
        .from('strains')
        .select('*')
        .limit(3);

    if (sampleError) {
        console.error("❌ Error fetching sample strains:", sampleError.message);
    } else if (sample && sample.length > 0) {
        console.log("✅ Sample Strains:", JSON.stringify(sample, null, 2));
    } else {
        console.warn("⚠️ ‘strains’ table exists but is EMPTY.");
    }

    // 3. Check Storage Buckets
    const { data: buckets, error: storageError } = await supabase
        .storage
        .listBuckets();

    if (storageError) {
        console.error("❌ Error listing storage buckets:", storageError.message);
    } else {
        console.log("📦 Storage Buckets:", buckets.map(b => b.name));

        // Specifically look for 'strains' or 'gallery'
        const strainBucket = buckets.find(b => b.name === 'strains' || b.name === 'strain-images');
        if (strainBucket) {
            console.log(`✅ Found strain bucket: ${strainBucket.name}`);
            const { data: files, error: filesError } = await supabase
                .storage
                .from(strainBucket.name)
                .list('', { limit: 5 });
            if (!filesError) console.log(`📁 Files in ${strainBucket.name}:`, files.map(f => f.name));
        } else {
            console.warn("⚠️ No 'strains' or 'strain-images' bucket found.");
        }
    }
}

inspectStrains();
