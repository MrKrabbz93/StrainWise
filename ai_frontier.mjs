import { GoogleGenerativeAI } from "@google/generative-ai";
import readline from 'readline';
// Environment variables loaded via node --env-file=.env

const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY or VITE_GEMINI_API_KEY not found in environment.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.clear();
console.log("\x1b[32m====================================================\x1b[0m");
console.log("\x1b[1m🚀 AI FRONTIER CONTENT GENERATOR v2.0\x1b[0m");
console.log("\x1b[32m====================================================\x1b[0m");
console.log("System initialized. Connected to Gemini 2.0 Flash.");
console.log("Ready to generate high-conversion content for StrainWise.");

const generateContent = async () => {
    rl.question('\n\x1b[36m📝 Enter Content Topic (or "exit" to quit):\x1b[0m ', async (topic) => {
        if (topic.toLowerCase() === 'exit') {
            console.log("\x1b[33mShutting down AI Frontier system...\x1b[0m");
            rl.close();
            return;
        }

        rl.question('\x1b[36m🎯 Target Platform (TikTok, Facebook, Twitter, Reddit):\x1b[0m ', async (platform) => {

            console.log(`\n\x1b[33m⚡ Generating content for ${platform} about "${topic}"...\x1b[0m`);

            const prompt = `
            You are an expert social media strategist and content creator for "StrainWise", an advanced AI cannabis consultation app.
            
            Strictly follow the tone and format for the platform: ${platform}.
            Topic: "${topic}"

            App Key Features to Reference if relevant:
            - AI Consultant Personas (Helpful Guide, Connoisseur, Scientist)
            - AI Visual Strain Identification (Scan a bud)
            - Deep Web Research Lab (Find rare strains)
            - 3D Strain Encyclopedia
            - Dispensary Finder

            Output Format:
            1.  **Headline/Hook**: Catchy and platform-appropriate.
            2.  **Body Content**: The script (for video) or post text. Use emojis.
            3.  **Call to Action**: Drive downloads or engagement.
            4.  **Hashtags**: Relevant and trending.
            `;

            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                console.log("\n\x1b[32m----------------------------------------------------\x1b[0m");
                console.log("\x1b[1m✨ GENERATED CONTENT:\x1b[0m");
                console.log("\x1b[32m----------------------------------------------------\x1b[0m");
                console.log(text);
                console.log("\x1b[32m----------------------------------------------------\x1b[0m");

                // Mock Analytics
                console.log("\x1b[35m📊 PREDICTIVE ANALYTICS:\x1b[0m");
                console.log(`   - Est. Reach: ${Math.floor(Math.random() * 5000) + 1000} users`);
                console.log(`   - Engagement Score: ${(Math.random() * (9.8 - 7.5) + 7.5).toFixed(1)}/10`);
                console.log(`   - Best Post Time: ${Math.floor(Math.random() * 12) + 1}:00 PM`);
                console.log("\x1b[32m----------------------------------------------------\x1b[0m");

                generateContent(); // Loop
            } catch (error) {
                console.error("\x1b[31m❌ Generation Failed:\x1b[0m", error.message);
                generateContent();
            }
        });
    });
};

generateContent();
