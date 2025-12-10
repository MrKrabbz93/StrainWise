import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log("🏆 Calculating Rankings...");

        // 1. Fetch all users sorted by XP
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, xp, username')
            .order('xp', { ascending: false });

        if (error) throw error;

        // 2. Define Ranks
        const getRank = (xp) => {
            if (xp < 100) return 'Seedling';
            if (xp < 500) return 'Sprout';
            if (xp < 1000) return 'Vegetative';
            if (xp < 2500) return 'Flowering';
            if (xp < 5000) return 'Harvester';
            if (xp < 10000) return 'Cure Master';
            return 'Grandmaster Grower';
        };

        // 3. Batch Update Ranks
        // Ideally we do this in SQL, but for now JS loop is fine for <10k users
        const updates = profiles.map(p => ({
            id: p.id,
            rank: getRank(p.xp)
        }));

        for (const update of updates) {
            await supabase
                .from('profiles')
                .update({ rank: update.rank })
                .eq('id', update.id);
        }

        return res.status(200).json({ message: "Rankings Updated", count: updates.length });

    } catch (error) {
        console.error("Ranking Job Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
