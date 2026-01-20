import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple regex for email extraction
const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
const IGNORE_EMAILS = ['wixpress.com', 'sentry.io', 'example.com', 'domain.com', '.png', '.jpg', '.jpeg', '.gif', 'sentry', 'noreply'];

async function enrichLeads() {
    console.log("🕵️ STARTING EMAIL ENRICHMENT AGENT...");

    // 1. Fetch Candidates (Website exists, Email is null)
    const { data: leads, error } = await supabase
        .from('dispensaries')
        .select('id, name, website')
        .not('website', 'is', null)
        .is('email', null)
        .in('country', ['Thailand', 'Australia']); // Prioritize target markets

    if (error) {
        console.error("❌ DB Error:", error);
        return;
    }

    console.log(`🎯 Found ${leads.length} candidates to crawl.`);

    let successCount = 0;

    // 2. Crawl Loop (Limit concurrency to avoid overwhelming or getting blocked)
    for (const lead of leads) {
        if (!lead.website) continue;

        try {
            console.log(`Scanning: ${lead.website} (${lead.name})...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const response = await fetch(lead.website, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`Status ${response.status}`);

            const html = await response.text();

            // Extract Emails
            const matches = html.match(EMAIL_REGEX) || [];
            const uniqueEmails = [...new Set(matches.map(e => e.toLowerCase()))];

            // Filter bad emails
            const validEmails = uniqueEmails.filter(email => {
                return !IGNORE_EMAILS.some(ignore => email.includes(ignore));
            });

            // Prioritize best match
            const bestEmail = validEmails.find(e => e.includes('info')) ||
                validEmails.find(e => e.includes('contact')) ||
                validEmails.find(e => e.includes('hello')) ||
                validEmails[0];

            if (bestEmail) {
                console.log(`✅ FOUND: ${bestEmail}`);

                // Update DB
                await supabase
                    .from('dispensaries')
                    .update({ email: bestEmail, outreach_status: 'pending' })
                    .eq('id', lead.id);

                successCount++;
            } else {
                console.log(`💨 No email found.`);
            }

        } catch (err) {
            console.log(`❌ Failed: ${err.message}`);
        }

        // Politeness delay
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n🎉 ENRICHMENT COMPLETE.`);
    console.log(`Found ${successCount} new emails out of ${leads.length} visited.`);
}

enrichLeads();
