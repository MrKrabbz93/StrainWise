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
        console.log("Adding 'country' column...");
        await client.query(`
            ALTER TABLE public.dispensaries 
            ADD COLUMN IF NOT EXISTS country text DEFAULT 'Australia';
        `);
        console.log("✅ Column added.");
    } catch (e) {
        console.error("❌ Migration failed:", e.message);
    } finally {
        await client.end();
    }
}

migrate();
