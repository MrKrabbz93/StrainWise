import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        await client.connect();
        console.log("Adding missing columns to 'strains'...");

        await client.query(`
      ALTER TABLE public.strains 
      ADD COLUMN IF NOT EXISTS growing text,
      ADD COLUMN IF NOT EXISTS lineage text;
    `);

        console.log("✅ Schema migration complete.");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await client.end();
    }
}

migrate();
