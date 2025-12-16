import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const { Client } = pg;

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
let envConfig = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envConfig[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

// Try DATABASE_URL if DIRECT_URL fails or use it primarily
const connectionString = envConfig.DATABASE_URL || process.env.DATABASE_URL || envConfig.DIRECT_URL;

if (!connectionString) {
    console.error("Missing DIRECT_URL for database connection.");
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const statements = [
    // 1. STRAINS
    `DO $$ BEGIN
        ALTER TABLE IF EXISTS strains ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Public strains are viewable by everyone" ON strains;
        DROP POLICY IF EXISTS "Public strains are viewable by everyone." ON strains;
        CREATE POLICY "Public strains are viewable by everyone" ON strains FOR SELECT TO anon, authenticated USING (true);
    END $$;`,

    // 2. DISPENSARIES
    `DO $$ BEGIN
        ALTER TABLE IF EXISTS dispensaries ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Public dispensaries are viewable by everyone" ON dispensaries;
        CREATE POLICY "Public dispensaries are viewable by everyone" ON dispensaries FOR SELECT TO anon, authenticated USING (true);
    END $$;`,

    // 3. REVIEWS
    `DO $$ BEGIN
        ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Public reviews are viewable by everyone" ON reviews;
        CREATE POLICY "Public reviews are viewable by everyone" ON reviews FOR SELECT TO anon, authenticated USING (true);
    END $$;`,

    // 4. INVENTORY (Might fail if table invalid)
    `DO $$ BEGIN
        ALTER TABLE IF EXISTS dispensary_inventory ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Public inventory is viewable by everyone" ON dispensary_inventory;
        CREATE POLICY "Public inventory is viewable by everyone" ON dispensary_inventory FOR SELECT TO anon, authenticated USING (true);
    END $$;`
];

async function applyPolicies() {
    try {
        await client.connect();
        console.log("Connected to database...");

        for (const [index, sql] of statements.entries()) {
            try {
                await client.query(sql);
                console.log(`✅ Success for block ${index + 1}`);
            } catch (err) {
                console.error(`⚠️  Error for block ${index + 1}:`, err.message);
                // Continue to next block
            }
        }
    } catch (err) {
        console.error("❌ Fatal error:", err);
    } finally {
        await client.end();
    }
}

applyPolicies();
