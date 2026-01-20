import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// --- CONFIGURATION ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    console.log("🐘 Connecting to Database...");

    try {
        const sqlPath = path.resolve(__dirname, '../supabase_migrations/20251218_add_email.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        console.log("📜 Executing Migration...");
        await pool.query(sql);

        console.log("✅ Migration Successful: Email columns added.");
    } catch (err) {
        console.error("❌ Migration Failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
