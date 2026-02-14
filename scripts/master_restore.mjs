import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import fs from 'fs';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL;

async function run() {
    console.log("🛠️  Phase 1: Reconciling Strains Schema...");
    if (dbUrl) {
        // We use a small node script to run the SQL since we have pg installed
        try {
            execSync('node -e "import(\'pg\').then(({Client}) => { const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false} }); c.connect().then(() => c.query(fs.readFileSync(\'reconcile_strains.sql\', \'utf8\'))).then(() => c.end()).then(() => console.log(\'✅ SQL Applied\')) })"', { stdio: 'inherit', env: process.env });
        } catch (e) {
            console.warn("⚠️  SQL Script might have failed but continuing...", e.message);
        }
    }

    console.log("\n👤 Phase 2: Seeding Mock Profiles...");
    execSync('node scripts/seed_profiles.mjs', { stdio: 'inherit' });

    console.log("\n🌿 Phase 3: Restoring Strains Data...");
    execSync('node scripts/restore_strains.mjs', { stdio: 'inherit' });

    console.log("\n📝 Phase 4: Seeding Community Journals...");
    execSync('node scripts/seed_reviews.js', { stdio: 'inherit' });

    console.log("\n🔒 Phase 5: Fixing RLS Policies...");
    execSync('node scripts/fix_rls.js', { stdio: 'inherit' });

    console.log("\n🏁 MASTER RESTORATION COMPLETE. System is now data-rich.");
}

run();
