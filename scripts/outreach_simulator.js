import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// --- CONFIGURATION ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateOutreach() {
    console.log("📨 STARTING B2B OUTREACH SIMULATION...");

    // 1. Load Templates
    const templateTH = fs.readFileSync(path.resolve(__dirname, '../marketing/templates/b2b_outreach_th.md'), 'utf-8');
    const templateAU = fs.readFileSync(path.resolve(__dirname, '../marketing/templates/b2b_outreach_au.md'), 'utf-8');

    // 2. Fetch Sample Leads (2 from Thailand, 2 from Australia)
    const { data: leadsTH } = await supabase.from('dispensaries').select('*').eq('country', 'Thailand').limit(2);
    const { data: leadsAU } = await supabase.from('dispensaries').select('*').eq('country', 'Australia').limit(2);

    const samples = [...(leadsTH || []), ...(leadsAU || [])];

    console.log(`🎯 Simulating send for ${samples.length} prospects...\n`);

    // 3. Process & Merge
    samples.forEach(lead => {
        const isThai = lead.country === 'Thailand';
        let content = isThai ? templateTH : templateAU;

        // Simple Template Engine
        content = content.replace(/{Business Name}/g, lead.name);
        content = content.replace(/{Name or "Partner"}/g, "Partner"); // Default for cold outreach
        content = content.replace(/{Name or "Team"}/g, "Team");
        content = content.replace(/\(Link to your business page\)/g, `https://strainwise.app/dispensary/${lead.id}`);

        // Extract Subject Line (First line starting with "Option A")
        const subjectMatch = content.match(/Option A.*?: (.*)/);
        const subject = subjectMatch ? subjectMatch[1] : "Invitation to StrainWise";

        // Extract Body (Everything after "Email Body")
        const bodyParts = content.split('## Email Body');
        const body = bodyParts[1] ? bodyParts[1].trim() : "Error parsing body.";

        console.log(`----------------------------------------------------------------`);
        console.log(`TO:       ${lead.email || "info@" + (lead.website ? new URL(lead.website).hostname : "domain.com")}`);
        console.log(`REGION:   ${lead.city}, ${lead.country}`);
        console.log(`SUBJECT:  ${subject}`);
        console.log(`----------------------------------------------------------------`);
        console.log(body);
        console.log(`\n\n`);
    });

    console.log("✅ Simulation Complete. Ready for production send.");
}

simulateOutreach();
