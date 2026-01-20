import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env");
    console.error("Checked: VITE_SUPABASE_URL, SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
    console.log("📊 CRO Asset Audit Initiated...");
    console.log("--------------------------------");

    // 1. Strain Balance
    const { count: strainCount, error: strainError } = await supabase
        .from('strains')
        .select('*', { count: 'exact', head: true });

    if (strainError) console.error("Error counting strains:", strainError.message);
    else console.log(`🌿 Total Strains Asset:      ${strainCount}`);

    // 2. Dispensary Network
    const { count: dispCount, error: dispError } = await supabase
        .from('dispensaries')
        .select('*', { count: 'exact', head: true });

    if (dispError) console.error("Error counting dispensaries:", dispError.message);
    else console.log(`🏥 Dispensary Network Size:  ${dispCount}`);

    // 3. User Traction
    // Note: 'users' table might be in auth or public, usually we can't count auth.users easily without service role.
    // We'll check 'profiles' or similar if it exists, otherwise skip.
    // Assuming 'strains' and 'dispensaries' are the main assets for valuation today.

    // 4. Revenue Leak Check
    // Sample check for missing affiliate links (simulated as we know we use dynamic fallback)
    const { count: missingAff, error: affError } = await supabase
        .from('strains')
        .select('*', { count: 'exact', head: true })
        .is('affiliate_link', null);

    if (!affError) {
        console.log(`⚠️  Implied Revenue Leaks:     ${missingAff} strains (using dynamic fallback)`);
    }

    console.log("--------------------------------");
    console.log("✅ Audit Complete.");
    process.exit(0);
}

runAudit();
