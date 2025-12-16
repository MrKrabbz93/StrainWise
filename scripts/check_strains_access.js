import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
let envConfig = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envConfig[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAccess() {
    console.log("Checking anonymous access to 'strains' (fetching id, name)...");
    const { data, error } = await supabase
        .from('strains')
        .select('id, name')
        .limit(3);

    if (error) {
        console.error("❌ Error fetching strains:", error.message);
    } else {
        console.log(`✅ Success. Rows returned: ${data?.length}`);
        console.log("Data snippet:", data);
        if (!data || data.length === 0) {
            console.warn("⚠️  Zero rows returned. RLS is likely blocking read access.");
        }
    }
}

checkAccess();
