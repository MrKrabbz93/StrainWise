import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

const MOCK_PROFILES = [
    { username: 'TerpeneKing', bio: 'Living for the Linalool.', interests: 'Heavy Indicas, Science, Breeding', xp: 5000, rank: 'CONNOISSEUR' },
    { username: 'GreenWizard', bio: 'Magic in every nug.', interests: 'Sativas, Creativity, Art', xp: 3200, rank: 'EXPLORER' },
    { username: 'FrostyNugz', bio: 'Trichome hunter.', interests: 'Flower, Macros, Soil Science', xp: 1200, rank: 'NOVICE' },
    { username: 'CannaQueen', bio: 'Wellness & Weed.', interests: 'CBD, Microdosing, Edibles', xp: 7500, rank: 'MASTER' },
    { username: 'MaryJaneExplorer', bio: 'Searching for the perfect terpene profile.', interests: 'Strains, Travel, Reviews', xp: 4400, rank: 'CONNOISSEUR' }
];

async function seed() {
    console.log("🌱 Seeding Mock Profiles...");

    // We need real UUIDs or we just upsert with dummy ones for the profiles table 
    // (Note: Profiles usually link to auth.users, but we can have public profiles without auth for display)
    // For the seeder, let's just generate some unique UUIDs if the table allows it.

    for (const p of MOCK_PROFILES) {
        const { data, error } = await supabase.from('profiles').upsert({
            id: crypto.randomUUID(), // This might violate FK if profiles references auth.users
            ...p,
            is_public: true,
            account_type: 'personal',
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`
        }, { onConflict: 'username' });

        if (error) console.error(`❌ Error seeding ${p.username}:`, error.message);
        else console.log(`✅ Seeded ${p.username}`);
    }
}

seed();
