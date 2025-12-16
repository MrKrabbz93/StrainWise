import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env if running locally
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const BASE_URL = 'https://strainwise.app'; // Production URL

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase Secrets. Please check your .env file.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateSitemap() {
    console.log("🗺️ Generating Dynamic Sitemap...");

    // 1. Fetch current sitemap structure (static routes)
    // We'll just define them here to be safe and clean.
    const staticRoutes = [
        '',
        '/consult',
        '/strains',
        '/dispensaries',
        '/journal',
        '/privacy',
        '/terms'
    ];

    // 2. Fetch ALL strains from DB
    // Pagination might be needed if > 1000, but let's grab top 1000 for now or fetch all.
    // Supabase default limit is 1000 usually.
    let { data: strains, error } = await supabase
        .from('strains')
        .select('name')
        .limit(2000);

    if (error) {
        console.error("❌ DB Error:", error.message);
        return;
    }

    console.log(`📚 Found ${strains.length} strains to index.`);

    // 3. Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add Static
    staticRoutes.forEach(route => {
        xml += `  <url>
    <loc>${BASE_URL}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    // Add Dynamic Strains
    strains.forEach(strain => {
        // Simple slugify: "Blue Dream" -> "blue-dream"
        // This MUST match the logic in the router/frontend.
        const slug = strain.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        // Escape special chars if any (though slugify mostly handles it)
        const safeSlug = slug;

        xml += `  <url>
    <loc>${BASE_URL}/strain/${safeSlug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    });

    xml += `</urlset>`;

    // 4. Write to public/sitemap.xml
    try {
        const publicPath = path.resolve('public/sitemap.xml');
        fs.writeFileSync(publicPath, xml);
        console.log(`✅ Sitemap written to ${publicPath}`);
        console.log(`   (Size: ${(fs.statSync(publicPath).size / 1024).toFixed(2)} KB)`);
    } catch (writeErr) {
        console.error("❌ Failed to write sitemap:", writeErr);
    }
}

generateSitemap();
