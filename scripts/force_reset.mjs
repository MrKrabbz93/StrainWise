import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function reset() {
    console.log("Locating user...");
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error(listError);
        return;
    }

    const user = users.find(u => u.email === 'tkh.creator@strainwise.app');
    if (!user) {
        console.error("❌ User not found!");
        return;
    }

    console.log("Found user:", user.id);
    console.log("Force resetting password...");

    const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: 'StrainWise-Creator-777!', email_confirm: true }
    );

    if (updateError) {
        console.error("❌ Reset failed:", updateError.message);
    } else {
        console.log("✅ Password successfully reset to: StrainWise-Creator-777!");
    }
}

reset();
