
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const keys = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_GOOGLE_MAPS_API_KEY',
    'TAVILY_API_KEY',
    'PEXELS_API_KEY',
    'STRIPE_SECRET_KEY',
    'DATABASE_URL',
    'DIRECT_URL',
    'GEMINI_API_KEY',
    'OPENAI_API_KEY',
    'JWT_SECRET',
    'RESEND_API_KEY'
];

async function addEnv(key, value) {
    return new Promise((resolve) => {
        if (!value) {
            console.log(`Skipping ${key} (no value)`);
            resolve();
            return;
        }

        console.log(`Setting ${key}...`);

        // On Windows cmd, piping is hard, so we use spawn and write to stdin
        const child = spawn('cmd', ['/c', 'npx', 'vercel', 'env', 'add', key, 'production'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        child.stdout.on('data', (data) => {
            const output = data.toString();
            // console.log(`[${key} stdout] ${output}`);
            if (output.includes('What is the value')) {
                child.stdin.write(value + '\n');
            }
            // If it says "already exists", it might loop asking? No, usually it errors or asks if we want to add another target.
            // Actually, if it exists, `vercel env add` might ask "Variable ... already exists. Do you want to add it to ...?"
            // We might need to remove it first? `vercel env rm KEY production`? 
            // Let's assume fresh project or overwrite isn't needed (manual check).
        });

        child.stderr.on('data', (data) => {
            // console.error(`[${key} stderr] ${data.toString()}`);
        });

        child.on('close', (code) => {
            if (code === 0) console.log(`✅ ${key} set.`);
            else console.log(`⚠️ ${key} process exited with code ${code}. (May already exist)`);
            resolve();
        });
    });
}

async function main() {
    for (const key of keys) {
        await addEnv(key, process.env[key]);
    }
    console.log("Done setting env vars.");
}

main();
