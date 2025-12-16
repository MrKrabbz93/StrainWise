import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';
const { Client } = pg;

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

async function migrateCache() {
    if (!dbUrl) {
        console.error("❌ DATABASE_URL missing.");
        return;
    }
    const client = new Client({ connectionString: dbUrl });
    try {
        await client.connect();
        console.log("Creating response_cache table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.response_cache (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                prompt_hash text NOT NULL,
                system_hash text,
                model text NOT NULL,
                response text NOT NULL,
                created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
                expires_at timestamp with time zone DEFAULT timezone('utc'::text, now() + interval '7 days') NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_response_cache_hashes ON public.response_cache(prompt_hash, system_hash);
            ALTER TABLE public.response_cache ENABLE ROW LEVEL SECURITY;
            
            -- Policies (Broad for now to allow server/client access if needed)
            DROP POLICY IF EXISTS "Enable read access for all users" ON public.response_cache;
            CREATE POLICY "Enable read access for all users" ON public.response_cache FOR SELECT USING (true);
            
            DROP POLICY IF EXISTS "Enable insert for all users" ON public.response_cache;
            CREATE POLICY "Enable insert for all users" ON public.response_cache FOR INSERT WITH CHECK (true);
        `);
        console.log("✅ Cache table created.");
    } catch (e) {
        console.error("❌ Migration failed:", e.message);
    } finally {
        await client.end();
    }
}

migrateCache();
