import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function viewLeads() {
    console.log("\n👑 THE LEDGER: Recent Outreach Engagements\n" + "=".repeat(50));

    const { data, error } = await supabase
        .from('dispensaries')
        .select('name, twitter_handle, outreach_status, last_contacted_at, lead_notes')
        .eq('outreach_status', 'engaged')
        .order('last_contacted_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("❌ Error fetching leads:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("📭 No recent engagements found in the Ledger.");
    } else {
        data.forEach(lead => {
            console.log(`👤 Name:   ${lead.name}`);
            console.log(`🐦 X:      @${lead.twitter_handle}`);
            console.log(`📅 Date:   ${new Date(lead.last_contacted_at).toLocaleString()}`);
            console.log(`📝 Note:   ${lead.lead_notes}`);
            console.log("-".repeat(50));
        });
    }
}

viewLeads();
