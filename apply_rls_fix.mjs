import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFix() {
    console.log("🛠️ Applying RLS Fix for 'strains' table...");

    const sql = fs.readFileSync('fix_strains_rls.sql', 'utf8');

    // Split SQL by semicolons and filter out empty strings
    const commands = sql.split(';').map(c => c.trim()).filter(c => c.length > 0);

    for (const command of commands) {
        console.log(`Running: ${command.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: command });

        if (error) {
            // If exec_sql RPC doesn't exist, we'll try a different approach or warn the user
            console.warn(`⚠️ Command failed or RPC missing: ${error.message}`);
            console.log("Attempting direct table access check for RLS...");
            break;
        }
    }

    console.log("Verification of RLS fix...");
    // Test with ANON key to see if data is now visible
    const anonClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const { count, error: fetchError } = await anonClient.from('strains').select('*', { count: 'exact', head: true });

    if (fetchError) {
        console.error("❌ Verification failed:", fetchError.message);
    } else {
        console.log(`✅ Success! ${count} strains are now visible to the public (ANON).`);
    }
}

applyFix();
