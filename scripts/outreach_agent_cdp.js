import { chromium } from 'playwright';
import { createInterface } from 'readline';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// 1. LOAD ENV FIRST (Critical for AI Service)
const envFile = fs.existsSync(path.join(ROOT_DIR, '.env.marketing')) ? '.env.marketing' : '.env';
dotenv.config({ path: path.join(ROOT_DIR, envFile) });

console.log(`📡 Env Loaded: ${envFile}`);
if (!process.env.GEMINI_API_KEY && !process.env.VITE_GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY missing! AI will likely fail.");
}

// 2. DYNAMIC IMPORT (To use Env Vars loaded above)
const { callGemini } = await import('../src/lib/gemini.js');

const HISTORY_FILE = path.join(ROOT_DIR, 'marketing', 'outreach_history.json');

class OutreachAgentChrome {
    constructor() {
        this.browser = null;
        this.page = null;
        this.debugPort = 9222;
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async connectToExistingChrome() {
        console.log(`🔌 Connecting to Chrome on port ${this.debugPort}...`);

        const endpoints = [
            `http://127.0.0.1:${this.debugPort}`,
            `http://localhost:${this.debugPort}`
        ];

        for (const endpoint of endpoints) {
            try {
                process.stdout.write(`   Trying ${endpoint}... `);
                this.browser = await chromium.connectOverCDP(endpoint);
                console.log("Connected! ✅");

                // Get the first active context and page
                const context = this.browser.contexts()[0];
                const pages = context.pages();
                this.page = pages.length > 0 ? pages[0] : await context.newPage();

                return true;
            } catch (error) {
                console.log(`Failed. ❌`);
            }
        }

        console.error('\n❌ Failed to connect to Chrome. Ensure you ran:');
        console.error(`   "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe" --remote-debugging-port=${this.debugPort}`);
        return false;
    }

    async navigateToHome() {
        if (!this.page) throw new Error('Chrome connection not established');
        console.log("🏠 Navigating to Home...");
        await this.page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Simple check for login
        if (this.page.url().includes('login')) {
            console.error("⚠️ It appears you are NOT logged in. Please log in manually in the window.");
            await this.page.waitForURL('**/home', { timeout: 0 }); // Wait indefinitely for user to login
            console.log("✅ Login detected!");
        }
    }

    async searchAndEngage(keywords) {
        if (!this.page) throw new Error('Chrome connection not established');

        for (const keyword of keywords) {
            console.log(`\n🔍 Searching for: "${keyword}"`);

            // 1. PERFORM SEARCH
            await this.page.goto(`https://x.com/search?q=${encodeURIComponent(keyword)}&src=typed_query&f=live`, { waitUntil: 'domcontentloaded' });

            try {
                await this.page.waitForSelector('article[data-testid="tweet"]', { timeout: 15000 });
            } catch (e) {
                console.log(`⚠️ No results for ${keyword}`);
                continue;
            }

            // 2. PARSE TWEETS
            const tweets = await this.page.$$eval('article[data-testid="tweet"]', (elements) => {
                return elements.slice(0, 3).map(el => {
                    const textEl = el.querySelector('[data-testid="tweetText"]');
                    const content = textEl ? textEl.innerText : el.innerText;

                    // Attempt to grab handle/link for ID
                    const linkEl = el.querySelector('a[href*="/status/"]');
                    const id = linkEl ? linkEl.href.split('/status/')[1] : null;
                    const handle = linkEl ? linkEl.href.split('/')[3] : 'unknown';

                    return { id, handle, content, platform: 'Twitter' };
                });
            });

            console.log(`   Found ${tweets.length} tweets.`);

            // 3. ENGAGE LOOP
            for (const tweet of tweets) {
                if (!tweet.id || this.isAlreadyEngaged(tweet.id)) {
                    continue;
                }

                console.log(`\n🧵 Processing Tweet by @${tweet.handle}:`);
                console.log(`   "${tweet.content.substring(0, 60)}..."`);

                // A. DECIDE PERSONA
                const persona = await this.decidePersona(tweet);
                console.log(`   🎭 Selected Persona: ${persona.name.toUpperCase()} (${persona.rationale})`);

                // Filter: Only allow 'Guide' for now per user instructions
                // if (persona.name.toLowerCase() !== 'guide') {
                //    console.log("   🚫 Skipping: Restricted to GUIDE persona only for initial tests.");
                //    continue;
                // }

                // B. DRAFT COMMENT
                let comment = await this.draftAndAnneal(tweet, persona);
                console.log(`   📝 Draft: "${comment}"`);

                if (comment.includes("Error generating content")) {
                    console.log("   ❌ AI Generation Failed. Skipping.");
                    continue;
                }

                // C. POST WITH CONFIRMATION
                await this.postCommentWithConfirmation(tweet, comment, persona.name);

                await this.page.waitForTimeout(3000);
            }
        }
    }

    async postCommentWithConfirmation(tweet, comment, personaName) {
        return new Promise((resolve) => {
            this.rl.question(`\n🚀 [ACTION REQUIRED] Post this reply? (y/n): `, async (answer) => {
                if (answer.toLowerCase().trim() === 'y') {
                    try {
                        console.log("   🖱️ Clicking tweet...");
                        // Click tweet to open thread
                        // We need a stable selector for the tweet in the list. 
                        // Using text content match is safer than index if list shifted.
                        // Or just navigate to status URL directly! Safer.
                        await this.page.goto(`https://x.com/${tweet.handle}/status/${tweet.id}`, { waitUntil: 'domcontentloaded' });

                        // Wait for reply box
                        const replyBox = '[data-testid="tweetTextarea_0"]';
                        await this.page.waitForSelector(replyBox, { timeout: 5000 });

                        console.log("   ⌨️ Typing...");
                        await this.page.fill(replyBox, comment);

                        // Wait a sec
                        await this.page.waitForTimeout(1000);

                        console.log("   📨 Sending...");
                        await this.page.click('[data-testid="tweetButtonInline"]');

                        console.log('   ✅ Comment posted successfully!');
                        this.logEngagement(tweet, comment, personaName);

                    } catch (e) {
                        console.error(`   ❌ Failed to post: ${e.message}`);
                    }
                } else {
                    console.log('   ⏩ Comment skipped by user.');
                }
                resolve();
            });
        });
    }

    // --- AI HELPERS ---

    async decidePersona(post) {
        const prompt = `Analyze this tweet: "${post.content}"
        Personas: 
        1. Scientist (Biochem knowledge, terpenes, cannabinoids)
        2. Connoisseur (Flavor, aroma, quality, strain history)
        3. Guide (Wellness, relief, effects, helpful)
        
        Which one fits best? RETURN JSON (no markdown): { "name": "scientist|connoisseur|guide", "rationale": "reason" }`;

        const result = await this.callGeminiWithRetry({ type: 'generate', prompt });
        try {
            return JSON.parse(result.replace(/```json/g, '').replace(/```/g, ''));
        } catch (e) { return { name: "guide", rationale: "fallback" }; }
    }

    async draftAndAnneal(post, persona) {
        let comment = await this.callGeminiWithRetry({
            type: 'generate',
            prompt: `Draft a reply to this tweet as the ${persona.name} persona: "${post.content}".
            Rules: <200 chars. Friendly. No hashtags. Subtle StrainWise mention if natural.
            Tone: ${persona.name === 'scientist' ? 'Analytical' : persona.name === 'connoisseur' ? 'Appreciative' : 'Supportive'}.`
        });

        // Simple refinement step
        if (comment.length > 200) {
            comment = await this.callGeminiWithRetry({
                type: 'generate',
                prompt: `Shorten this tweet to under 200 chars: "${comment}"`
            });
        }
        return comment.replace(/"/g, '');
    }

    async callGeminiWithRetry(payload, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                return await callGemini(payload);
            } catch (e) {
                if (e.status === 429) {
                    await new Promise(r => setTimeout(r, 2000 * (i + 1)));
                    continue;
                }
                return "Error generating content: " + e.message;
            }
        }
        return "Error generating content.";
    }

    // --- DATA HELPERS ---

    isAlreadyEngaged(id) {
        if (!fs.existsSync(HISTORY_FILE)) return false;
        try {
            const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
            return history.some(h => h.id === id);
        } catch (e) { return false; }
    }

    logEngagement(post, comment, persona) {
        const history = fs.existsSync(HISTORY_FILE) ? JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')) : [];
        history.push({
            id: post.id,
            handle: post.handle,
            content: post.content,
            reply: comment,
            persona,
            timestamp: new Date().toISOString()
        });
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    }

    async disconnect() {
        if (this.browser) {
            await this.browser.disconnect();
            console.log('🔌 Disconnected from Chrome session.');
        }
        this.rl.close();
    }
}

// MAIN EXECUTION
async function run() {
    console.log("🚀 StrainWise Outreach Agent (Live Mode) Starting...");
    const agent = new OutreachAgentChrome();
    if (await agent.connectToExistingChrome()) {
        await agent.navigateToHome();

        const keywords = ["#cannabiscommunity", "terpenes", "cannabis review"];
        await agent.searchAndEngage(keywords);

        await agent.disconnect();
    }
}

run().catch(console.error);
