import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDuplicates() {
    const { data: allLeads, error } = await supabase
        .from('dispensaries')
        .select('name, email, outreach_status')
        .not('email', 'is', null);

    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    const emailMap = new Map();
    const duplicates = [];

    for (const lead of allLeads) {
        if (emailMap.has(lead.email)) {
            duplicates.push({
                email: lead.email,
                names: [emailMap.get(lead.email).name, lead.name],
                statuses: [emailMap.get(lead.email).outreach_status, lead.outreach_status]
            });
        } else {
            emailMap.set(lead.email, lead);
        }
    }

    if (duplicates.length > 0) {
        console.log(`⚠️ Found ${duplicates.length} duplicate email addresses in DB:`);
        console.table(duplicates);
    } else {
        console.log("✅ No duplicate email addresses found in the current dataset.");
    }
}

checkDuplicates();
