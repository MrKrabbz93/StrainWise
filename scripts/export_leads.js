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

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Export Error: Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportLeads() {
    console.log("📤 Starting Lead Export...");

    // Fetch Target Markets (Thailand & Australia)
    const { data: leads, error } = await supabase
        .from('dispensaries')
        .select('id, name, country, city, address, website, phone, email')
        .in('country', ['Thailand', 'Australia']);

    if (error) {
        console.error("❌ Error fetching data:", error);
        return;
    }

    console.log(`🌿 Found ${leads.length} potential leads in Target Markets.`);

    // Filter for "Contactable" leads (Email OR (Website or Phone))
    // For Mailchimp, we strictly NEED email.
    const contactableLeads = leads.filter(l => l.email);
    console.log(`💎 Filtered to ${contactableLeads.length} High-Quality Leads (with Email).`);

    // Format for CSV (Standard CRM Import Format)
    // Headers: Name, Country, City, Website, Phone, Email, Profile Link
    const csvRows = [
        ['Business Name', 'Country', 'City', 'Website', 'Phone', 'Email', 'Profile Link']
    ];

    contactableLeads.forEach(l => {
        // Sanitize fields for CSV (escape commas)
        const safeName = l.name ? `"${l.name.replace(/"/g, '""')}"` : '';
        const safeCity = l.city ? `"${l.city.replace(/"/g, '""')}"` : '';
        const safeWeb = l.website || '';
        const safePhone = l.phone || '';
        const safeEmail = l.email || '';
        const profileLink = `https://strainwise.app/dispensary/${l.id}`; // Placeholder URL structure

        csvRows.push([safeName, l.country, safeCity, safeWeb, safePhone, safeEmail, profileLink]);
    });

    // Write to file
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const outputPath = path.resolve(__dirname, '../leads_export.csv');

    fs.writeFileSync(outputPath, csvContent);
    console.log(`✅ Export Complete! File saved to: ${outputPath}`);
}

exportLeads();
