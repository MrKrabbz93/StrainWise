import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase configuration. Check .env file.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);

const MOCK_USERNAMES = [
    'TerpeneKing', 'GreenWizard', 'CloudChaser', 'BudBotanist', 'MaryJaneExplorer',
    'StickyResin', 'HighHacker', 'ZestyZen', 'FrostyNugz', 'CannaQueen'
];

async function generateReview(strainName, strainType) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Write a short, realistic, and enthusiastic cannabis strain review for "${strainName}" (${strainType}). 
    Keep it under 30 words. Mention flavor and effects. Style: Social media post for a community of connoisseurs.`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().replace(/"/g, '').trim();
    } catch (e) {
        return "Absolutely fire. The flavor is incredible and the head high is perfect for a creative session.";
    }
}

async function seed() {
    console.log("🌱 Starting Community Seeding...");

    // 1. Get some real strains
    const { data: strains } = await supabase.from('strains').select('name, type, id').limit(10);

    // 2. Get some profiles or create mocks
    const { data: profiles } = await supabase.from('profiles').select('id, username').limit(5);

    if (!strains || strains.length === 0) {
        console.error("No strains found to review.");
        return;
    }

    for (let i = 0; i < 15; i++) {
        const strain = strains[Math.floor(Math.random() * strains.length)];
        const profile = profiles && profiles.length > 0 ? profiles[Math.floor(Math.random() * profiles.length)] : { id: null };

        const review = await generateReview(strain.name, strain.type);
        const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars

        const journal = {
            user_id: profile.id, // Can be null if we want anonymous, but better with real IDs
            strain_id: strain.name,
            strain_name: strain.name,
            rating,
            effects: ['Happy', 'Relaxed', 'Uplifted'].slice(0, Math.floor(Math.random() * 3) + 1),
            review: review,
            notes: review,
            is_public: true,
            created_at: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString() // Past 3 days
        };

        if (profile.id) {
            const { error } = await supabase.from('strain_journals').insert([journal]);
            if (error) console.error("Error inserting review:", error.message);
            else console.log(`✅ Seeded: ${strain.name} by ${profile.username}`);
        }
    }

    console.log("🏁 Seeding Complete.");
}

seed();
