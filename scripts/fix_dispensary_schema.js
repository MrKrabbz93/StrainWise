import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';
const { Client } = pg;

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

async function resetDispensariesTable() {
    if (!dbUrl) {
        console.error("❌ DATABASE_URL missing.");
        return;
    }
    const client = new Client({ connectionString: dbUrl });
    try {
        await client.connect();
        console.log("🔥 Dropping old dispensaries table...");
        await client.query(`DROP TABLE IF EXISTS public.dispensaries;`);

        console.log("✨ Creating fresh dispensaries table...");
        await client.query(`
            CREATE TABLE public.dispensaries (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                name text NOT NULL,
                region text,
                city text,
                address text,
                website text,
                phone text,
                rating numeric,
                created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
                CONSTRAINT dispensaries_name_addr_key UNIQUE (name, address)
            );
            ALTER TABLE public.dispensaries ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "Enable read access for all users" ON public.dispensaries FOR SELECT USING (true);
            CREATE POLICY "Enable insert for service role only" ON public.dispensaries FOR INSERT WITH CHECK (true);
        `);
        console.log("✅ Table reset successfully.");
    } catch (e) {
        console.error("❌ Failed to reset table:", e.message);
    } finally {
        await client.end();
    }
}

resetDispensariesTable();
