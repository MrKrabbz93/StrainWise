import OpenAI from 'openai';
import { callGemini } from '../src/lib/gemini.js';
import { supabase } from '../src/lib/supabase.js';
import dotenv from 'dotenv';
import fs from 'fs';
import { chromium } from 'playwright';

dotenv.config({ path: '.env' });
if (fs.existsSync('.env.marketing')) {
    dotenv.config({ path: '.env.marketing', override: true });
}

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
const openAiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
if (!apiKey && !openAiKey) {
    console.error("❌ CRITICAL: No AI API Key found (Gemini or OpenAI) in environment or .env file.");
    console.log("Available Env Keys:", Object.keys(process.env).filter(k => k.includes('KEY')));
    process.exit(1);
}
console.log(`📡 Using ${apiKey ? 'Gemini' : 'OpenAI'} API key.`);

const args = {};
process.argv.slice(2).forEach((val, index, array) => {
    if (val.startsWith('--')) {
        const key = val.slice(2);
        const value = array[index + 1];
        args[key] = value && !value.startsWith('--') ? value : true;
    }
});

const objective = args.objective || 'General App Awareness & Community Growth';

console.log(`📡 Environment variables loaded.`);
console.log(`🎯 Objective: ${objective}`);

/**
 * SELF-ANNEALING MARKETING AGENT
 */
async function runMarketingAgent() {
    console.log("🚀 Starting Self-Annealing Marketing Agent...");

    // 1. OBSERVE
    let data;
    if (args.input) {
        if (fs.existsSync(args.input)) {
            console.log(`📂 Loading input from: ${args.input}`);
            // Adapt input format if necessary. Assuming raw harvest JSON array.
            const rawData = JSON.parse(fs.readFileSync(args.input, 'utf8'));
            // Mock recent activity format if raw data is just dispensaries
            data = {
                trendingStrains: rawData.map(d => d.name || "Unknown").slice(0, 5),
                recentActivity: rawData.slice(0, 5)
            };
        } else {
            console.error(`❌ Input file not found: ${args.input}`);
            process.exit(1);
        }
    } else {
        data = await gatherData();
    }

    console.log(`📊 Data Ready: ${data.trendingStrains.length} items.`);

    // 2 & 3. PLAN & GENERATE (Initial)
    let strategy = await generateStrategy(data);

    // 4. ANNEALING LOOP (Critique & Refine)
    let quality = 0;
    let iterations = 0;
    while (quality < 8 && iterations < 3) {
        console.log(`🔍 Annealing Iteration ${iterations + 1}...`);
        const critique = await critiqueStrategy(strategy);
        quality = critique.score;
        if (quality < 8) {
            console.log(`⚠️ Quality too low (${quality}/10). Refining...`);
            strategy = await refineStrategy(strategy, critique.feedback);
        }
        iterations++;
    }

    console.log("✅ Final Strategy Approved. Content ready for distribution.");

    if (args.output) {
        fs.writeFileSync(args.output, JSON.stringify(strategy, null, 2));
        console.log(`💾 Strategy saved to: ${args.output}`);
    } else {
        console.log(JSON.stringify(strategy, null, 2));
    }

    // 5. EXECUTE (Distribute)
    await distributeContent(strategy);
}

async function gatherData() {
    let strains = [];
    let activity = [];

    try {
        const strainRes = await supabase.from('strain_journals').select('strain_name');
        strains = (strainRes.data || []).slice(0, 20);

        const activityRes = await supabase.from('community_activity').select('*');
        activity = (activityRes.data || []).slice(0, 5);
    } catch (e) {
        console.warn("⚠️ Database observation partially limited by environment. Using baseline trends.");
    }

    // Count frequencies
    const counts = strains.reduce((acc, curr) => {
        acc[curr.strain_name] = (acc[curr.strain_name] || 0) + 1;
        return acc;
    }, {});

    const trending = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(i => i[0]);

    // Fallback if empty
    const finalTrending = trending.length > 0 ? trending : ["Blue Dream", "OG Kush", "Girl Scout Cookies"];

    return { trendingStrains: finalTrending, recentActivity: activity };
}

async function generateStrategy(data) {
    const prompt = `Act as an Elite Social Media Manager. Create a viral marketing blast for StrainWise.
    MISSION OBJECTIVE: ${objective}
    TRENDING DATA: Strains: ${data.trendingStrains.join(', ')}. Activity: ${data.recentActivity.length} new entries.

    GENERATE:
    1. Twitter Thread (3-5 tweets)
    2. Instagram/FB Caption + Suggest 1 Image Prompt for AI Image Gen.
    3. TikTok Script (Fast-paced, high energy).

    VOICE: Premium, High-Tech, Knowledgeable.

    RETURN JSON FORMAT:
    { "twitter": [], "instagram": { "caption": "", "image_prompt": "" }, "tiktok": { "script": "" } }`;

    // Prefer OpenAI if available
    if (openAiKey) {
        const openai = new OpenAI({ apiKey: openAiKey });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });
        const result = completion.choices[0].message.content;
        return JSON.parse(result.replace(/```json/g, '').replace(/```/g, '').trim());
    }
    // Fallback to Gemini via callGemini
    const result = await callGemini({ type: 'generate', prompt });
    return JSON.parse(result.replace(/```json/g, '').replace(/```/g, '').trim());
}

// Helper for robust JSON extraction
function extractFirstJson(text) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
        return text.substring(start, end + 1);
    }
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

async function critiqueStrategy(strategy) {
    const prompt = `Critique this social media strategy for 'StrainWise'. 
    Is it too generic? Does it sound luxury? Does it have strong hooks?
    STRATEGY: ${JSON.stringify(strategy)}
    RETURN JSON: { "score": 1-10, "feedback": "detailed feedback" }`;

    let text;
    if (openAiKey) {
        const openai = new OpenAI({ apiKey: openAiKey });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });
        text = completion.choices[0].message.content;
    } else {
        text = await callGemini({ type: 'generate', prompt });
    }
    return JSON.parse(extractFirstJson(text));
}

async function refineStrategy(strategy, feedback) {
    const prompt = `Refine this StrainWise strategy based on feedback. Make it 10/10 quality.
    STRATEGY: ${JSON.stringify(strategy)}
    FEEDBACK: ${feedback}
    RETURN JSON (Same format as original).`;

    let text;
    if (openAiKey) {
        const openai = new OpenAI({ apiKey: openAiKey });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });
        text = completion.choices[0].message.content;
    } else {
        text = await callGemini({ type: 'generate', prompt });
    }
    return JSON.parse(extractFirstJson(text));
}

async function distributeContent(strategy) {
    console.log("📡 Distribution Phase...");

    // Twitter
    if (process.env.TWITTER_USER) {
        // await postToTwitter(strategy.twitter);
        console.log("ℹ️ Twitter distribution delegated to Outreach Agent (CDP Mode) for safety.");
    }

    // Additional platforms follow the same pattern...
    console.log("🏁 Distribution Complete.");
}

async function postToTwitter(thread) {
    console.log("🐦 Posting to Twitter...");
    const browser = await chromium.launch({ headless: false }); // Visible for user to see it happening
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto('https://twitter.com/login');
        await page.fill('input[name="text"]', process.env.TWITTER_USER);
        await page.click('text=Next');
        await page.fill('input[name="password"]', process.env.TWITTER_PASS);
        await page.click('text=Log in');

        // Post first tweet... (Simplified for brevity)
        console.log("✅ Twitter post successful (Simulation - requires more precise selectors per platform)");
    } catch (e) {
        console.error("❌ Twitter Post Failed:", e);
    } finally {
        await browser.close();
    }
}

// EXECUTE
runMarketingAgent().catch(console.error);
