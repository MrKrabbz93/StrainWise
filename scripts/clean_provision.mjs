import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Missing keys");
    process.exit(1);
}

const supabase = createClient(url, key, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    console.log("Checking users...");
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error(error);
        return;
    }
    console.log("Found", users.length, "users.");
    const existing = users.find(u => u.email === 'tkh.creator@strainwise.app');

    let userId;
    if (existing) {
        console.log("User exists:", existing.id);
        userId = existing.id;
    } else {
        console.log("Creating user...");
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: 'tkh.creator@strainwise.app',
            password: 'StrainWise-Creator-777!',
            email_confirm: true
        });
        if (createError) {
            console.error("Create error:", createError.message);
            return;
        }
        userId = newUser.user.id;
        console.log("Created user:", userId);
    }

    console.log("Upserting profile...");
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        email: 'tkh.creator@strainwise.app',
        avatar_url: '/avatars/creator-founder.png',
        bio: "Architect of the Mycelium. Visionary Founder of StrainWise. Building the global intelligence layer for medicinal cannabis. The Prime Mover.",
        interests: "AI Ethics, Bio-Lifestyle Optimization, Global Cannabis Markets, Distributed Systems, Autonomous Agent Swarms.",
        is_public: true,
        account_type: 'corporate',
        subscription_status: 'lifetime',
        xp: 777000,
        rank: 'THE PRIME MOVER'
    });

    if (profileError) {
        console.error("Profile error:", profileError.message);
    } else {
        console.log("✅ Profile Sync Complete.");
    }
}

run();
