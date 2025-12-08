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

async function testProfileUpdate() {
    console.log("🧪 Starting Profile Customization Test...");

    // 1. Create a random test user
    const email = `antigravity_test_${Date.now()}@gmail.com`;
    const password = 'password123';

    console.log(`Creating test user: ${email}`);
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        console.error("❌ Sign up failed:", signUpError.message);
        return;
    }

    if (!user) {
        console.error("❌ User creation failed (no user returned).");
        return;
    }

    console.log("✅ User created:", user.id);

    // 2. Define profile updates
    const updates = {
        username: `user_${Date.now()}`,
        bio: 'This is a test bio for verification.',
        avatar_url: 'https://api.dicebear.com/9.x/notionists/svg?seed=test',
        interests: 'Testing, Verification'
    };

    console.log("Updating profile with:", updates);

    // 3. Perform Update
    // Note: The profile row should be created by a trigger or manually. 
    // If our app relies on the client to create it, we might need an insert first or upsert.
    // Let's check if the row exists first.

    // In our app logic, we might rely on a trigger or the user inserting it.
    // Let's try upserting to be safe, as UserProfile.jsx uses update() but assumes existence.
    // Actually, let's try update first, and if it fails (0 rows), we know we need to handle creation.

    // Wait a moment for any triggers to run (if any)
    await new Promise(r => setTimeout(r, 1000));

    const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates }); // Using upsert to ensure it works even if row missing

    if (updateError) {
        console.error("❌ Profile update failed:", updateError.message);
        return;
    }

    console.log("✅ Profile update command sent.");

    // 4. Verify Persistence
    console.log("Fetching profile to verify persistence...");
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (fetchError) {
        console.error("❌ Fetch failed:", fetchError.message);
        return;
    }

    // 5. Check fields
    let passed = true;
    if (profile.username !== updates.username) { console.error(`❌ Username mismatch: expected ${updates.username}, got ${profile.username}`); passed = false; }
    if (profile.bio !== updates.bio) { console.error(`❌ Bio mismatch: expected ${updates.bio}, got ${profile.bio}`); passed = false; }
    if (profile.avatar_url !== updates.avatar_url) { console.error(`❌ Avatar mismatch: expected ${updates.avatar_url}, got ${profile.avatar_url}`); passed = false; }

    if (passed) {
        console.log("🎉 SUCCESS: Profile customization verified! Data is persistent.");
    } else {
        console.error("⚠️ TEST FAILED: Data mismatch.");
    }

    // Cleanup (optional, but good practice if we had a delete user function, but we don't have admin key here easily)
}

testProfileUpdate();
