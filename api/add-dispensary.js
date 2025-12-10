import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tavilyApiKey = process.env.TAVILY_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !tavilyApiKey) {
    console.error("Missing environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, address, city, state, website, user_id } = req.body;

    if (!name || !address) {
        return res.status(400).json({ error: 'Name and Address are required' });
    }

    try {
        console.log(`Processing Dispensary: ${name}`);

        // 1. Basic Verification with Tavily: Does this place exist?
        // We'll trust the user more here but use Tavily to try and find coordinates if possible or just verify existence.
        const query = `${name} dispensary ${address} ${city || ''} ${state || ''}`;

        const tavilyResponse = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: tavilyApiKey,
                query: query,
                search_depth: "basic",
                max_results: 1
            })
        });

        // We won't block strictly on this, but it's good context.
        // If Tavily finds nothing, maybe flag it for review? For now, we accept it but maybe don't verify coordinates.
        // Ideally we'd use Google Geocoding here to get Lat/Lng.

        // 2. Insert into Supabase
        const { data: dispensary, error: insertError } = await supabase
            .from('dispensaries')
            .insert([
                {
                    name,
                    address: `${address}, ${city || ''}, ${state || ''}`,
                    // lat/lng left null for now unless we integrate a geocoder. 
                    // (Tavily doesn't reliably give coords in standard search).
                    submitted_by: user_id // Track who added it
                }
            ])
            .select()
            .single();

        if (insertError) throw insertError;

        // 3. Handle Gamification (XP & Contributions)
        let earnedXP = 0;
        let newTotalXP = 0;

        if (user_id) {
            // Increment contributions count
            // Fetch current profile first
            const { data: profile } = await supabase.from('profiles').select('xp, contributions_count').eq('id', user_id).single();

            if (profile) {
                const currentCount = (profile.contributions_count || 0) + 1;
                let xpToAdd = 20; // Base XP for adding a dispensary
                earnedXP = 20;

                // Bonus Check
                if (currentCount % 5 === 0) {
                    xpToAdd += 100;
                    earnedXP += 100;
                }

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        xp: (profile.xp || 0) + xpToAdd,
                        contributions_count: currentCount
                    })
                    .eq('id', user_id);

                if (updateError) console.error("Failed to update XP:", updateError);
            }
        }

        return res.status(200).json({
            message: 'Dispensary added successfully!',
            dispensary: dispensary,
            earned_xp: earnedXP
        });

    } catch (error) {
        console.error('Error in add-dispensary:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
