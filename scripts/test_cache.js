import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

console.log("Loading keys...");
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("❌ Missing .env keys");
    console.log("URL:", url ? "Set" : "Missing");
    console.log("Key:", key ? "Set" : "Missing");
    process.exit(1);
}

const supabase = createClient(url, key);

async function testCache() {
    console.log("Testing Cache Table...");

    // 1. Insert
    const promptHash = "test_hash_" + Date.now();
    const { error: insertError } = await supabase.from('response_cache').insert({
        prompt_hash: promptHash,
        system_hash: 'none',
        model: 'test-model',
        response: 'Test Response',
        expires_at: new Date(Date.now() + 1000 * 60).toISOString()
    });

    if (insertError) {
        console.error("❌ Insert Failed:", insertError);
        return;
    }
    console.log("✅ Insert Successful");

    // 2. Read
    const { data, error: readError } = await supabase
        .from('response_cache')
        .select('*')
        .eq('prompt_hash', promptHash)
        .maybeSingle(); // Test the method I used

    if (readError) {
        console.error("❌ Read Failed:", readError);
    } else if (data && data.response === 'Test Response') {
        console.log("✅ Read Successful (Cache Hit)");
    } else {
        console.error("❌ Cache Miss or Data Mismatch", data);
    }
}

testCache();
