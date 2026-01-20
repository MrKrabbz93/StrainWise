import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSentStatus() {
    const { data, error } = await supabase
        .from('dispensaries')
        .select('name, email, outreach_status, contacted_at')
        .eq('outreach_status', 'sent')
        .order('contacted_at', { ascending: false });

    if (error) {
        console.error("❌ Error:", error.message);
    } else {
        console.log(`📡 Leads marked as 'sent': ${data.length}`);
        console.table(data);
    }
}

checkSentStatus();
