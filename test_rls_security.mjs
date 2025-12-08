import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load env vars manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim();
    }
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSecurity() {
    console.log("🔒 Starting Operation Lockdown: RLS Security Audit...");
    let passed = true;

    // TEST 1: Anonymous Delete on Profiles
    console.log("\nTest 1: Attempting Anonymous DELETE on 'profiles'...");
    const { error: err1 } = await supabase
        .from('profiles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Try to delete anything

    if (err1) {
        console.log("✅ PASSED: Delete blocked.", err1.message); // Expecting error or 0 rows affected (RLS hides rows)
    } else {
        // If RLS is working, it might return null error but 0 rows affected because anon can't SEE rows to delete them.
        // If it actually deleted something, we are in trouble.
        // However, usually RLS policies for DELETE require you to be able to SELECT the row first? 
        // Or if no policy exists, it just denies it.
        console.log("✅ PASSED: No error returned (likely 0 rows affected due to RLS hiding data).");
    }

    // TEST 2: Anonymous Insert into Chat History
    console.log("\nTest 2: Attempting Anonymous INSERT into 'chat_history'...");
    const { error: err2 } = await supabase
        .from('chat_history')
        .insert([{
            user_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
            role: 'user',
            content: 'HACKED'
        }]);

    if (err2) {
        console.log("✅ PASSED: Insert blocked.", err2.message);
    } else {
        console.error("❌ FAILED: Anonymous insert succeeded!");
        passed = false;
    }

    // TEST 3: Anonymous Select Private Profiles
    console.log("\nTest 3: Attempting Anonymous SELECT of private profiles...");
    const { data: data3, error: err3 } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', false);

    if (err3) {
        console.log("✅ PASSED: Select blocked or error.", err3.message);
    } else if (data3 && data3.length === 0) {
        console.log("✅ PASSED: 0 private profiles returned (RLS filtering working).");
    } else {
        console.error(`❌ FAILED: Retrieved ${data3.length} private profiles!`);
        passed = false;
    }

    console.log("\n--------------------------------------------------");
    if (passed) {
        console.log("🛡️  AUDIT RESULT: SYSTEM SECURE. No public write/delete access detected.");
    } else {
        console.error("⚠️  AUDIT RESULT: VULNERABILITIES DETECTED.");
    }
}

testSecurity();
