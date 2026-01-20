import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const { partnerId, strainName } = req.query;

    if (!partnerId) {
        return res.status(400).json({ error: 'Missing partnerId' });
    }

    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 1. Log the click for analytics
        await supabase.from('affiliate_clicks').insert([
            {
                partner_id: partnerId,
                strain_name: strainName || null,
                user_agent: req.headers['user-agent'],
                referrer: req.headers['referer'] || 'direct',
                ip_hash: req.headers['x-forwarded-for'] || req.socket.remoteAddress
            }
        ]);

        // 2. Find the partner link from our database
        // In a real environment, we'd fetch this from the JSON or DB.
        // For now, we'll use a mapping or redirect to a standard landing page if not found.

        // This is where we define the tracking URLs for each partner
        const partnerLinks = {
            'ilgm': 'https://ilgm.com?aff=strainwise',
            'seedsman': 'https://www.seedsman.com/?a_aid=strainwise',
            'alternaleaf-au': 'https://www.alternaleaf.com.au/',
            'storz-bickel': 'https://www.storz-bickel.com/?aff=strainwise',
            'puffco': 'https://www.puffco.com/?ref=strainwise',
            'dutchie-b2b': 'https://dutchie.com/referrals/strainwise',
            'blaze-b2b': 'https://blaze.ai/affiliate-program/?ref=strainwise',
            'crop-king-seeds': 'https://www.cropkingseeds.com/?aff=strainwise',
            'beaver-seeds': 'https://beaverseeds.com/?aff=strainwise',
            'royal-queen-seeds': 'https://www.royalqueenseeds.com/?aff=strainwise',
            'ardent-cannabis': 'https://ardentcannabis.com/?aff=strainwise',
            'smoke-cartel': 'https://www.smokecartel.com/?aff=strainwise',
            'daily-high-club': 'https://dailyhighclub.com/?aff=strainwise',
            'dr-dabber': 'https://www.drdabber.com/?aff=strainwise',
            'omura-x': 'https://www.omura.com/?aff=strainwise'
        };

        const targetUrl = partnerLinks[partnerId.toLowerCase()] || 'https://strainwise.app';

        // 3. Redirect
        res.writeHead(302, { Location: targetUrl });
        res.end();

    } catch (error) {
        console.error('Redirect Error:', error);
        // Fallback redirect if logging fails
        res.writeHead(302, { Location: 'https://strainwise.app' });
        res.end();
    }
}
