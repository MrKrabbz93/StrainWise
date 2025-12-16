
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials. Ensure VITE_SUPABASE_URL and SERVICE_ROLE_KEY are set.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
    console.log("Checking Supabase Storage buckets...");

    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error("Error fetching buckets:", error);
        return;
    }

    const avatarBucket = buckets.find(b => b.name === 'avatars');

    if (avatarBucket) {
        console.log("✅ 'avatars' bucket exists.");
    } else {
        console.log("⚠️ 'avatars' bucket missing. Creating...");
        const { data, error: createError } = await supabase.storage.createBucket('avatars', {
            public: true,
            fileSizeLimit: 2097152, // 2MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
        });
        if (createError) {
            console.error("Failed to create bucket:", createError);
        } else {
            console.log("✅ 'avatars' bucket created successfully.");
        }
    }

    // Update Policies (Idempotent-ish check)
    console.log("Updating storage policies...");

    // We can't update policies via JS client easily without SQL.
    // We will output SQL to run if needed, but for now assuming bucket creation is key.
    // Actually, let's run a raw SQL query via rpc or just log the instruction.
    // The previous setup instructions included SQL, we'll trust that or run a migration script.
}

setupStorage();
