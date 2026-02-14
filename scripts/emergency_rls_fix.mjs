import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Client } = pkg;

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

async function fix() {
    if (!dbUrl) {
        console.error("DATABASE_URL missing");
        return;
    }

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to DB...");

        const sql = `
            -- Table 1: Strains
            ALTER TABLE public.strains ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Public strains are viewable by everyone" ON public.strains;
            CREATE POLICY "Public strains are viewable by everyone" ON public.strains FOR SELECT USING (true);

            -- Table 2: Dispensaries
            ALTER TABLE public.dispensaries ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Public dispensaries are viewable by everyone" ON public.dispensaries;
            CREATE POLICY "Public dispensaries are viewable by everyone" ON public.dispensaries FOR SELECT USING (true);

            -- Table 3: Journals
            ALTER TABLE public.strain_journals ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Public can read public journals" ON public.strain_journals;
            CREATE POLICY "Public can read public journals" ON public.strain_journals FOR SELECT USING (is_public = true);

            -- Table 4: Profiles
            ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
            CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
        `;

        await client.query(sql);
        console.log("✅ RLS Fix Applied Successfully");
    } catch (e) {
        console.error("❌ Error:", e.message);
    } finally {
        await client.end();
    }
}

fix();
