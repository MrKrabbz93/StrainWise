import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEMPLATE_PATHS = {
    'Thailand': '../marketing/templates/b2b_outreach_th.md',
    'Australia': '../marketing/templates/b2b_outreach_au.md'
};

async function simulate() {
    console.log("🧪 DRY RUN: OUTREACH SIMULATION");

    const { data: leads, error } = await supabase
        .from('dispensaries')
        .select('id, name, country, email')
        .not('email', 'is', null)
        .eq('outreach_status', 'pending')
        .limit(3); // Sample of 3

    if (error) {
        console.error(error);
        return;
    }

    console.log(`📡 Simulating 3 leads from ${leads.length} available...\n`);

    for (const lead of leads) {
        const templatePath = path.resolve(__dirname, TEMPLATE_PATHS[lead.country]);
        if (!fs.existsSync(templatePath)) continue;

        let content = fs.readFileSync(templatePath, 'utf-8');
        const subjectMatch = content.match(/Subject: (.*)/);
        const subject = subjectMatch ? subjectMatch[1] : `Invitation for ${lead.name}`;

        let body = content.replace(/Subject: .*\n/, '').replace(/---.*\n/, '');
        body = body.replace(/\[Business Name\]/g, lead.name);
        body = body.replace(/\[Profile Link\]/g, `https://strainwise.app/dispensary/${lead.id}`);

        console.log(`----------------------------------------`);
        console.log(`TO: ${lead.email} (${lead.country})`);
        console.log(`SUBJECT: ${subject}`);
        console.log(`BODY PREVIEW (First 100 chars): ${body.substring(0, 100)}...`);
    }
}

simulate();
