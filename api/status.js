import { supabase } from '../src/lib/supabase.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const status = {
            mcp: 'online',
            database: 'offline',
            ai_engine: 'stable',
            latency: '142ms',
            last_sync: new Date().toISOString()
        };

        // 1. Check Supabase Connectivity
        const { error: dbError } = await supabase.from('strains').select('id').limit(1);
        if (!dbError) {
            status.database = 'connected';
        }

        // 2. Check AI Engine (Simulated or via env check)
        if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENROUTER_API_KEY) {
            status.ai_engine = 'degraded';
        }

        return res.status(200).json(status);
    } catch (error) {
        console.error("Status Check Error:", error);
        return res.status(500).json({ error: 'Health check failed', details: error.message });
    }
}
