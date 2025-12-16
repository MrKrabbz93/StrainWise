import { generateCacheKey, getPersistentCache, setPersistentCache } from '../src/lib/cache.ts';

// Assume this is your expensive AI function
async function fetchStrainInfoFromAI(strainName) {
    console.log(`AI: Fetching fresh info for ${strainName}...`);
    // Simulate a slow network call to an AI provider
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { strain: strainName, effects: ['Relaxed', 'Happy'], flavor: 'Earthy, Pine' };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { strainName } = req.body;
    if (!strainName) {
        return res.status(400).json({ error: 'strainName is required' });
    }

    // 1. Generate a unique cache key for this specific request
    const cacheKey = generateCacheKey({ type: 'strainInfo', strainName });

    try {
        // 2. Try to get the response from the persistent cache first
        let cachedResponse = await getPersistentCache(cacheKey);

        if (cachedResponse) {
            console.log(`CACHE HIT for ${strainName}`);
            return res.status(200).json(cachedResponse);
        }

        // 3. If not in cache, call the expensive AI function
        console.log(`CACHE MISS for ${strainName}`);
        const aiResponse = await fetchStrainInfoFromAI(strainName);

        // 4. Store the new response in the cache for future requests
        await setPersistentCache(cacheKey, aiResponse, 3600); // Cache for 1 hour

        // 5. Return the fresh response
        res.status(200).json(aiResponse);

    } catch (error) {
        console.error('Error in /api/strain-info:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
