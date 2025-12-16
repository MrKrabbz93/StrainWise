import fs from 'fs';
import path from 'path';

// This script generates a simple sitemap.xml
// In a real app, you might fetch dynamic routes (strain IDs) from the DB

const BASE_URL = 'https://strainwise.app';
const STATIC_ROUTES = [
    '/',
    '/login',
    '/register',
    '/consultant',
    '/encyclopedia',
    '/community',
    '/profile'
];

// Mock dynamic routes for demo
const DYNAMIC_ROUTES = [
    '/strains/blue-dream',
    '/strains/og-kush',
    '/strains/granddaddy-purple'
];

const generateSitemap = () => {
    const allRoutes = [...STATIC_ROUTES, ...DYNAMIC_ROUTES];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${allRoutes.map(route => `
    <url>
        <loc>${BASE_URL}${route}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>${route === '/' ? '1.0' : '0.8'}</priority>
    </url>
    `).join('')}
</urlset>`;

    const publicDir = path.resolve('public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
    console.log('✅ sitemap.xml generated in public/');
};

generateSitemap();
