export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { strainName } = req.query;

    if (!strainName) {
        return res.status(400).json({ error: 'strainName query parameter is required' });
    }

    try {
        const apiKey = process.env.PEXELS_API_KEY;
        if (!apiKey) {
            console.warn("PEXELS_API_KEY not set. Using fallback.");
            // Fallback to a generic image if no API key is configured
            const fallbackImage = "https://images.pexels.com/photos/1254891/pexels-photo-1254891.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
            return res.status(200).json({ imageUrl: fallbackImage });
        }

        // Create a search query.
        const searchQuery = `${strainName} cannabis bud green plant`;

        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=square`, {
            headers: {
                'Authorization': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`Pexels API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.photos && data.photos.length > 0) {
            // Return the medium-sized square image
            const imageUrl = data.photos[0].src.medium;
            return res.status(200).json({ imageUrl });
        } else {
            // If no results, return a generic high-quality cannabis image
            const fallbackImage = "https://images.pexels.com/photos/1254891/pexels-photo-1254891.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
            return res.status(200).json({ imageUrl: fallbackImage });
        }

    } catch (error) {
        console.error('Error fetching image from Pexels:', error);
        // Final fallback: a stable Wikimedia Commons image
        const finalFallbackImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Cannabis_sativa_Koehler_drawing.jpg/600px-Cannabis_sativa_Koehler_drawing.jpg";
        return res.status(200).json({ imageUrl: finalFallbackImage });
    }
}
