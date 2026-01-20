import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function checkSchema() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Missing Supabase Credentials.");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data, error } = await supabase
            .from('dispensaries')
            .select('*')
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            console.log("✅ Columns found in 'dispensaries':", Object.keys(data[0]).join(', '));
        } else {
            console.log("⚠️ No data in 'dispensaries' to check columns.");
            // Try rpc if available or just assume it's empty
        }
    } catch (error) {
        console.error("❌ Error checking schema:", error.message);
    }
}

checkSchema();
