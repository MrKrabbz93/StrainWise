import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    lines.forEach((line, index) => {
        if (line.includes('RESEND_API_KEY')) {
            const parts = line.split('=');
            if (parts.length > 1) {
                const val = parts[1].trim();
                console.log(`Line ${index + 1}: Key starts with: ${val.substring(0, 10)}... Length: ${val.length}`);
                if (val.includes(' ')) {
                    console.log(`⚠️ WARNING: Line ${index + 1} contains a space!`);
                }
            }
        }
    });
} else {
    console.log(".env not found");
}
