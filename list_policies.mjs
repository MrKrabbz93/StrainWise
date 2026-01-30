
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listPolicies() {
    const { data, error } = await supabase.rpc('get_policies', { table_name: 'strains' });

    if (error) {
        // Fallback if RPC doesn't exist: Query pg_policies directly via SQL if possible
        // But usually we can't do that easily via Client JS.
        // Let's try to just select from pg_policies via a generic query if enabled.
        console.error("RPC 'get_policies' failed. Trying direct query...");

        const { data: sqlData, error: sqlError } = await supabase.from('strains').select('*').limit(1);
        console.log("Can select from strains:", !!sqlData);

        console.log("Please check policies manually in Supabase UI or provide the SQL output of: SELECT * FROM pg_policies WHERE tablename = 'strains';");
        return;
    }

    console.log("Policies on 'strains':", data);
}

listPolicies();
