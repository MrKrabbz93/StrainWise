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

    const { name, type, thc_level, cbd_level, effects, flavor, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Strain name is required' });
    }

    try {
        console.log(`Verifying strain: ${name}`);

        // 1. Construct Logic for Tavily Search
        const query = `"${name}" cannabis strain information type THC CBD effects flavor review site:leafly.com OR site:wikileaf.com OR site:allbud.com`;

        // 2. Call Tavily API
        const tavilyResponse = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: tavilyApiKey,
                query: query,
                search_depth: "basic",
                include_answer: true,
                max_results: 5
            })
        });

        if (!tavilyResponse.ok) {
            throw new Error(`Tavily API error: ${tavilyResponse.statusText}`);
        }

        const searchData = await tavilyResponse.json();

        // 3. Verification Logic
        let isVerified = false;
        let sourceUrl = null;
        let verificationReason = "";

        const cleanName = name.toLowerCase().trim();
        const reputableDomains = ['leafly.com', 'wikileaf.com', 'allbud.com', 'hytiva.com'];

        // Check Answer
        if (searchData.answer && searchData.answer.toLowerCase().includes(cleanName)) {
            isVerified = true;
            verificationReason = "Found in AI Answer";
        }

        // Check Results
        if (!isVerified && searchData.results && searchData.results.length > 0) {
            for (const result of searchData.results) {
                const resultUrl = result.url.toLowerCase();
                const resultTitle = result.title.toLowerCase();
                const resultContent = result.content.toLowerCase();

                // Check if URL is from a reputable domain AND title contains strain name
                const isReputable = reputableDomains.some(domain => resultUrl.includes(domain));

                if (isReputable && resultTitle.includes(cleanName)) {
                    isVerified = true;
                    sourceUrl = result.url;
                    verificationReason = `Found on reputable site: ${result.url}`;
                    break;
                }
            }
        }

        console.log(`Verification Result for ${name}: ${isVerified} (${verificationReason})`);

        if (!isVerified) {
            return res.status(400).json({
                error: `Could not verify '${name}' against trusted cannabis databases. Please rename or try again later.`,
                details: "We check Leafly, Wikileaf, and Allbud to ensure data quality."
            });
        }

        // 4. Insert into Supabase
        const { data, error } = await supabase
            .from('strains')
            .insert([
                {
                    name,
                    type: type || 'Hybrid', // Default
                    thc_level,
                    cbd_level,
                    effects: effects, // Assuming text column, or handle array if needed
                    flavor: flavor,
                    description: description || searchData.answer || 'No description provided.',
                    is_verified: true,
                    source_url: sourceUrl || searchData.results?.[0]?.url
                }
            ])
            .select();

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

        return res.status(200).json({
            message: 'Strain verified and added successfully!',
            strain: data[0],
            verification_source: sourceUrl
        });

    } catch (error) {
        console.error('Error in verify-and-add-strain:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
