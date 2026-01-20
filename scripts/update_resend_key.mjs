import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const newKey = 're_4MqRT5EX_8cKMUdjUdxqXSpkQXgMmnUd7';

if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf-8');
    if (content.includes('RESEND_API_KEY=')) {
        content = content.replace(/RESEND_API_KEY=.*/, `RESEND_API_KEY=${newKey}`);
    } else {
        content += `\nRESEND_API_KEY=${newKey}\n`;
    }
    fs.writeFileSync(envPath, content);
    console.log("✅ .env updated with new RESEND_API_KEY");
} else {
    fs.writeFileSync(envPath, `RESEND_API_KEY=${newKey}\n`);
    console.log("✅ .env created with new RESEND_API_KEY");
}
