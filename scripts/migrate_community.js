import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';
const { Client } = pg;

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

async function migrate() {
    if (!dbUrl) {
        console.error("❌ DATABASE_URL missing.");
        return;
    }
    const client = new Client({ connectionString: dbUrl });
    try {
        await client.connect();
        console.log("Applying Community Hub schema...");

        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strain_journals' AND column_name = 'is_public') THEN
                    ALTER TABLE public.strain_journals ADD COLUMN is_public boolean DEFAULT false;
                END IF;
            END $$;

            ALTER TABLE public.strain_journals ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Public can read public journals" ON public.strain_journals;
            CREATE POLICY "Public can read public journals" ON public.strain_journals FOR SELECT USING (is_public = true);

            DROP POLICY IF EXISTS "Users can manage own journals" ON public.strain_journals;
            CREATE POLICY "Users can manage own journals" ON public.strain_journals FOR ALL USING (auth.uid() = user_id);
        `);
        console.log("✅ Schema applied.");
    } catch (e) {
        console.error("❌ Migration failed:", e.message);
    } finally {
        await client.end();
    }
}

migrate();
