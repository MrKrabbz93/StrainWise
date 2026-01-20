import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLeads() {
    const { data, count, error } = await supabase
        .from('dispensaries')
        .select('name, country, email', { count: 'exact' })
        .not('email', 'is', null)
        .eq('outreach_status', 'pending')
        .in('country', ['Thailand', 'Australia']);

    if (error) {
        console.error("❌ Error:", error.message);
    } else {
        console.log(`📡 Target leads (AU/TH with email): ${count}`);
        if (data && data.length > 0) {
            console.log("First 5 samples:");
            console.table(data.slice(0, 5));
        }
    }
}

checkLeads();
