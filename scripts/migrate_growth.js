import pg from 'pg';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const { Client } = pg;
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        await client.connect();
        console.log("🚀 Starting Growth & Moderation Migration...");

        const sql = `
            -- 1. ADD REFERRAL COLUMNS TO PROFILES
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referral_code') THEN
                    ALTER TABLE public.profiles ADD COLUMN referral_code text UNIQUE;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by') THEN
                    ALTER TABLE public.profiles ADD COLUMN referred_by uuid REFERENCES auth.users(id);
                END IF;
            END $$;

            -- 2. CREATE REPORTS TABLE (Moderation)
            CREATE TABLE IF NOT EXISTS public.content_reports (
                id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
                reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
                journal_id bigint REFERENCES public.strain_journals(id) ON DELETE CASCADE,
                reason text NOT NULL,
                status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'removed')),
                created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
            );

            -- 3. ADD STATUS TO JOURNALS
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strain_journals' AND column_name = 'status') THEN
                    ALTER TABLE public.strain_journals ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'archived'));
                END IF;
            END $$;

            -- 4. RLS FOR REPORTS
            ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Authenticated users can report content" ON public.content_reports;
            CREATE POLICY "Authenticated users can report content" 
            ON public.content_reports 
            FOR INSERT 
            WITH CHECK (auth.uid() = reporter_id);

            DROP POLICY IF EXISTS "Admins can see reports" ON public.content_reports;
            CREATE POLICY "Admins can see reports" 
            ON public.content_reports 
            FOR ALL 
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND account_type = 'admin'
                )
            );

            -- 5. FUNCTION TO GENERATE REFERRAL CODES FOR EXISTING USERS
            UPDATE public.profiles 
            SET referral_code = 'SW-' || substring(id::text, 1, 8)
            WHERE referral_code IS NULL;
        `;

        await client.query(sql);
        console.log("✅ Migration Successful.");

    } catch (err) {
        console.error("❌ Migration Failed:", err);
    } finally {
        await client.end();
    }
}

migrate();
