import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase Service Role configuration.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const CREATOR_EMAIL = 'tkh.creator@strainwise.app';
const CREATOR_PASSWORD = 'StrainWise-Creator-777!'; // I will provide this to the user

async function provision() {
    console.log(`🚀 Provisioning Creator Profile for ${CREATOR_EMAIL}...`);

    try {
        // 1. Create User in Auth
        let userId;
        const { data: userData, error: authError } = await supabase.auth.admin.createUser({
            email: CREATOR_EMAIL,
            password: CREATOR_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: 'T.K Horomona', role: 'creator' }
        });

        if (authError) {
            if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
                console.log("ℹ️ User already exists in Auth. Fetching ID...");
                const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
                if (listError) throw listError;
                userId = listData.users.find(u => u.email === CREATOR_EMAIL)?.id;
            } else {
                throw authError;
            }
        } else {
            userId = userData.user.id;
        }

        if (!userId) throw new Error("Could not determine User ID");

        // 2. Upsert Profile
        const profileData = {
            id: userId,
            email: CREATOR_EMAIL,
            avatar_url: '/avatars/creator-founder.png',
            bio: "Architect of the Mycelium. Visionary Founder of StrainWise. Building the global intelligence layer for medicinal cannabis. The Prime Mover.",
            interests: "AI Ethics, Bio-Lifestyle Optimization, Global Cannabis Markets, Distributed Systems, Autonomous Agent Swarms.",
            is_public: true,
            account_type: 'corporate',
            subscription_status: 'lifetime',
            xp: 777000,
            rank: 'THE PRIME MOVER',
            prestige: 100,
            badges: ['Founder', 'Architect', 'Prime Mover', 'Vanguard', 'Alpha Voyager']
        };

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData);

        if (profileError) throw profileError;

        console.log("✅ Creator Profile Provisioned Successfully.");
        console.log(`🔑 Credentials: ${CREATOR_EMAIL} / ${CREATOR_PASSWORD}`);

    } catch (err) {
        console.error("❌ Provisioning Failed:", err.message);
        process.exit(1);
    }
}

provision();
