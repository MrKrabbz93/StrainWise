import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load env vars manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim();
    }
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
const geminiKey = envConfig.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseAnonKey || !geminiKey) {
    console.error("❌ Missing credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const genAI = new GoogleGenerativeAI(geminiKey);

async function testWelcomeEmail() {
    console.log("📧 Starting Welcome Email Verification...");

    // 1. Create User
    const email = `welcome_test_${Date.now()}@gmail.com`;
    const password = 'password123';
    const username = `NewUser_${Date.now()}`;

    console.log(`Creating user: ${email} (${username})`);
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        console.error("❌ Sign up failed:", signUpError.message);
        return;
    }

    if (!user) {
        console.error("❌ User creation failed.");
        return;
    }
    console.log("✅ User created:", user.id);

    // 2. Generate Welcome Message (Simulating src/lib/gemini.js logic)
    console.log("🤖 Generating AI Welcome Message...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Write a short, exclusive, high-value "Welcome Email" for a new user named "${username}" joining "StrainWise" (a premium AI cannabis consultant app).
    Tone: Sophisticated, Warm, Exclusive.
    Key Points to Mention:
    1. Access to the "AI Consultant".
    2. The "Strain Encyclopedia".
    Format strictly as JSON with keys: "subject", "body".`;

    let welcomeMsg = { subject: "Welcome", body: "Default welcome." };
    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        welcomeMsg = JSON.parse(jsonStr);
        console.log("✅ AI Generation Successful.");
        console.log("   Subject:", welcomeMsg.subject);
    } catch (e) {
        console.error("⚠️ AI Generation Failed (using fallback):", e.message);
    }

    // 3. Insert Message (Simulating AuthModal.jsx logic)
    console.log("📨 Inserting message into Supabase...");
    const { error: insertError } = await supabase
        .from('messages')
        .insert([{
            user_id: user.id,
            sender: 'StrainWise AI',
            subject: welcomeMsg.subject,
            body: welcomeMsg.body,
            read: false
        }]);

    if (insertError) {
        console.error("❌ INSERT FAILED:", insertError.message);
        if (insertError.message.includes("permission denied")) {
            console.error("\n🔴 CRITICAL: Permission Denied.");
            console.error("   The 'authenticated' role cannot write to the 'messages' table.");
            console.error("   Please run 'supabase_fix_permissions.sql' in your SQL Editor.");
        }
        return;
    }

    console.log("✅ Message inserted successfully.");

    // 4. Verify Persistence
    console.log("🔍 Fetching message to verify...");
    const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id);

    if (fetchError) {
        console.error("❌ Fetch failed:", fetchError.message);
        return;
    }

    if (messages && messages.length > 0) {
        const msg = messages[0];
        console.log("\n🎉 SUCCESS: Welcome Email Verified!");
        console.log("--------------------------------------------------");
        console.log(`To: ${username}`);
        console.log(`From: ${msg.sender}`);
        console.log(`Subject: ${msg.subject}`);
        console.log(`Body Snippet: ${msg.body.substring(0, 50)}...`);
        console.log("--------------------------------------------------");

        if (msg.body.includes(username)) {
            console.log("✅ Personalization Verified: Username found in body.");
        } else {
            console.warn("⚠️ Personalization Warning: Username NOT found in body.");
        }
    } else {
        console.error("❌ Message not found after insertion.");
    }
}

testWelcomeEmail();
