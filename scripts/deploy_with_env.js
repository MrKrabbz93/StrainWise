
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

async function deploy() {
    const args = ['vercel', '--prod', '--confirm']; // --confirm to skip confirmation

    // Add env vars
    for (const key of keys) {
        const val = process.env[key];
        if (val) {
            args.push('--env');
            // Format: KEY=VALUE
            args.push(`${key}=${val}`);
        }
    }

    console.log("🚀 Deploying to Vercel with Env Vars...");
    // console.log("Command:", 'npx', args.join(' '));

    const child = spawn('npx', args, {
        stdio: 'inherit', // Show output directly
        cwd: ROOT_DIR,
        shell: true // Needed for npx on Windows
    });

    child.on('close', (code) => {
        console.log(`Deploy process exited with code ${code}`);
    });
}

deploy();
