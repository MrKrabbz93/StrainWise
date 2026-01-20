import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// --- CONFIGURATION ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEMPLATE_PATHS = {
    'Thailand': '../marketing/templates/b2b_outreach_th.md',
    'Australia': '../marketing/templates/b2b_outreach_au.md'
};

const FROM_EMAIL = 'verify@strainwise.app'; // Verified in Resend

async function runOutreach() {
    console.log("🚀 INITIALIZING OUTREACH AGENT...");

    if (!process.env.RESEND_API_KEY) {
        console.error("❌ ERROR: RESEND_API_KEY is missing from .env");
        return;
    }

    // 1. Fetch leads that have emails and haven't been contacted yet
    const { data: leads, error } = await supabase
        .from('dispensaries')
        .select('id, name, country, email')
        .not('email', 'is', null)
        .eq('outreach_status', 'pending')
        .in('country', ['Thailand', 'Australia'])
        .limit(10);

    if (error) {
        console.error("❌ DB Error:", error);
        return;
    }

    console.log(`📡 Found ${leads.length} leads ready for outreach.`);

    for (const lead of leads) {
        try {
            const templatePath = path.resolve(__dirname, TEMPLATE_PATHS[lead.country]);
            if (!fs.existsSync(templatePath)) {
                console.warn(`⚠️ Template not found for ${lead.country}, skipping ${lead.name}`);
                continue;
            }

            const rawContent = fs.readFileSync(templatePath, 'utf-8');

            // --- SMART PARSING ---
            // 1. Get Subject (Look for Option A)
            const subjectMatch = rawContent.match(/\*\*Option A .*?:\*\* (.*)/);
            let subject = subjectMatch ? subjectMatch[1] : `StrainWise Verification: ${lead.name}`;
            subject = subject.replace(/\{Business Name\}/g, lead.name);

            // 2. Extract Body (Content after ## Email Body)
            const bodyParts = rawContent.split('## Email Body');
            let body = bodyParts.length > 1 ? bodyParts[1].trim() : rawContent;

            // --- PERSONALIZATION ---
            body = body.replace(/\{Business Name\}/g, lead.name);
            body = body.replace(/\{Name or "Team"\}/g, "Team");
            body = body.replace(/👉 \*\*\[Verify .*? Listing\]\*\*/g, `👉 **[Verify ${lead.name} Listing](https://strainwise.app/dispensary/${lead.id})**`);
            body = body.replace(/`(.*?)`/g, ''); // Remove small notes in backticks

            console.log(`📧 Sending to: ${lead.name} (${lead.email})...`);

            // 3. Send via Resend
            const { data, error: sendError } = await resend.emails.send({
                from: `StrainWise Verification <${FROM_EMAIL}>`,
                to: lead.email,
                subject: subject,
                html: body.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'), // Simple MD to HTML
            });

            if (sendError) {
                console.error(`❌ Failed: ${sendError.error?.message || sendError.message}`);
                continue;
            }

            // 4. Mark as sent in DB
            await supabase
                .from('dispensaries')
                .update({ outreach_status: 'sent' })
                .eq('id', lead.id);

            console.log(`✅ Success! ID: ${data?.id}`);

            // Politeness delay
            await new Promise(r => setTimeout(r, 5000));

        } catch (err) {
            console.error(`💥 Fatal error for ${lead.name}:`, err.message);
        }
    }

    console.log("🏁 OUTREACH COMPLETE.");
}

runOutreach();
