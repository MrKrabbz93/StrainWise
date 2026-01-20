import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
    console.log("Testing Resend with Key:", process.env.RESEND_API_KEY ? "EXISTS" : "MISSING");
    try {
        const { data, error } = await resend.emails.send({
            from: 'verify@strainwise.app',
            to: 'tkh.creator@strainwise.app',
            subject: 'Test Send from Code',
            html: '<b>Success</b>'
        });
        if (error) console.error("Error:", error);
        else console.log("Success! ID:", data.id);
    } catch (e) {
        console.error("Fatal:", e);
    }
}

test();
