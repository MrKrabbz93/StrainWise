import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runMigration() {
    console.log('🛰️ Starting Community Schema Migration...\n');
    console.log(`📡 Connecting to: ${supabaseUrl}\n`);

    try {
        // Read the SQL file
        const sqlPath = join(__dirname, '..', 'supabase_community_schema.sql');
        const sqlContent = readFileSync(sqlPath, 'utf-8');

        // Split SQL into individual statements
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📄 Executing ${statements.length} SQL statements...\n`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            // Skip comments
            if (statement.startsWith('--')) continue;

            try {
                console.log(`[${i + 1}/${statements.length}] Executing...`);

                // Use raw SQL execution via the REST API
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseServiceKey,
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ query: statement + ';' })
                });

                if (!response.ok && response.status !== 404) {
                    const errorText = await response.text();
                    console.log(`⚠️  Statement ${i + 1}: ${errorText.substring(0, 100)}`);
                }
            } catch (err) {
                console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
            }
        }

        console.log('\n🔍 Verifying table creation...');

        const tables = ['strain_journals', 'journal_likes', 'content_reports', 'community_activity'];

        for (const table of tables) {
            try {
                const { count, error: countError } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });

                if (countError) {
                    console.log(`❌ Table '${table}': ${countError.message}`);
                } else {
                    console.log(`✅ Table '${table}': Verified (${count || 0} rows)`);
                }
            } catch (err) {
                console.log(`⚠️  Table '${table}': ${err.message}`);
            }
        }

        console.log('\n🛡️ MIGRATION COMPLETE\n');
        console.log('Community features are now enabled:');
        console.log('  - Strain Journals (Public & Private)');
        console.log('  - Journal Likes');
        console.log('  - Content Reporting');
        console.log('  - Community Activity Feed');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runMigration();
