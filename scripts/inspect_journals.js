import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    const { data, error } = await supabase
        .from('strain_journals')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        // If empty, we can't easily see columns via select *, but we can try inserting dummy to see error or just assume.
        // Actually, Supabase JS types don't expose schema directly in runtime.
        // Better to use SQL inspection if possible, or just be safe and run a migration.
        console.log("Table exists but is empty.");
    }
}
inspect();
