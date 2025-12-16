import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is missing in .env");
    process.exit(1);
}

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const runMigration = async () => {
    try {
        const files = [
            'supabase_user_feedback_setup.sql',
            'supabase_strain_journals_setup.sql'
        ];

        console.log('🔌 Connecting to Database...');

        for (const fileName of files) {
            const sqlPath = path.join(__dirname, '../', fileName);
            if (!fs.existsSync(sqlPath)) {
                console.warn(`⚠️ Migration file not found: ${fileName}`);
                continue;
            }

            console.log(`⚡ Running Migration: ${fileName}`);
            const sql = fs.readFileSync(sqlPath, 'utf8');
            // Check for splits, otherwise run whole
            const statements = sql.includes('-- SPLIT') ? sql.split('-- SPLIT') : [sql];

            const client = await pool.connect();
            try {
                for (const [index, stmt] of statements.entries()) {
                    const trimmed = stmt.trim();
                    if (trimmed) {
                        if (statements.length > 1) console.log(`   Executing block ${index + 1}/${statements.length}...`);
                        await client.query(trimmed);
                    }
                }
                console.log(`   ✅ Success: ${fileName}`);
            } catch (fileErr) {
                console.error(`   ❌ Failed: ${fileName}`, fileErr.message);
                // We don't exit process, try next file? Or stop? 
                // For now, let's stop to be safe, or continue if idempotent.
                // let's throw to stop
                throw fileErr;
            } finally {
                client.release();
            }
        }

        console.log('✅ Migration Complete! AI Jobs System initialized.');
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

runMigration();
