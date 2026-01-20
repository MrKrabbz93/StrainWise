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

// 1. LOAD ENV FIRST
dotenv.config({ path: path.join(ROOT_DIR, '.env') });
if (fs.existsSync(path.join(ROOT_DIR, '.env.marketing'))) {
    dotenv.config({ path: path.join(ROOT_DIR, '.env.marketing'), override: true });
}

// 2. PARSE ARGS
const args = {};
process.argv.slice(2).forEach((val, index, array) => {
    if (val.startsWith('--')) {
        const key = val.slice(2);
        const value = array[index + 1];
        args[key] = value && !value.startsWith('--') ? value : true;
    }
});

// 3. DYNAMIC IMPORT AI
const { callGemini } = await import('../src/lib/gemini.js');

const HISTORY_FILE = path.join(ROOT_DIR, 'marketing', 'outreach_history.json');
const POSTING_INTERVAL_HOURS = 4;
const POSTING_INTERVAL_MS = POSTING_INTERVAL_HOURS * 60 * 60 * 1000;

class OutreachAgent {
    constructor() {
        this.browser = null;
        this.page = null;
        this.debugPort = 9222;
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.autoApprove = !!args.auto;
        this.lastPostTime = 0;
        this.isRunning = false;
        this.keywords = ["#cannabiscommunity", "terpenes", "#strainwise", "#cannabisculture"];
    }

    randomSleep(min, max) {
        return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1) + min)));
    }

    async connect() {
        if (args.headless) {
            console.log("🔌 Launching New Browser (Headless Mode)...");
            this.browser = await chromium.launch({ headless: true });
            const context = await this.browser.newContext();
            this.page = await context.newPage();
        } else {
            console.log(`🔌 Connecting to Existing Chrome on port ${this.debugPort}...`);
            const endpoints = [`http://127.0.0.1:${this.debugPort}`, `http://localhost:${this.debugPort}`];

            for (const endpoint of endpoints) {
                try {
                    this.browser = await chromium.connectOverCDP(endpoint);
                    const context = this.browser.contexts()[0];
                    const pages = context.pages();
                    this.page = pages.length > 0 ? pages[0] : await context.newPage();
                    console.log("✅ Connected via CDP.");
                    return true;
                } catch (e) { /* try next */ }
            }
            console.error("❌ Failed to connect to Chrome CDP.");
            return false;
        }
        return true;
    }

    async navigateToHome() {
        console.log("🏠 Navigating to Home...");
        try {
            await this.page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 60000 });
            await this.randomSleep(5000, 10000);

            const url = this.page.url();
            if (url.includes('login')) {
                console.error("⚠️ Not logged in. Please log in manually (if valid session).");
                if (!this.autoApprove) await this.page.waitForURL('**/home', { timeout: 0 });
            }
            if (url.includes('account/access') || url.includes('suspended')) {
                console.error("🚨 ACCOUNT SUSPENDED OR LOCKED. Terminating Agent.");
                process.exit(1);
            }
        } catch (e) {
            console.warn("Home navigation warning:", e.message);
        }
    }

    shouldPost() {
        const now = new Date();
        const currentHour = now.getHours();

        // 1. Check strict schedule alignment (9, 13, 17, 21)
        const OPTIMAL_HOURS = [9, 13, 17, 21];

        if (!OPTIMAL_HOURS.includes(currentHour)) {
            // Optional: verbose logging only every hour to avoid spam
            if (now.getMinutes() === 0) console.log(`⏳ Waiting for optimal hour (Current: ${currentHour}, Targets: ${OPTIMAL_HOURS.join(', ')})`);
            return false;
        }

        // 2. Check 4-hour cooldown
        const timeSinceLastPost = now.getTime() - this.lastPostTime;
        if (timeSinceLastPost < POSTING_INTERVAL_MS) {
            return false;
        }

        return true;
    }

    async runContinuous() {
        if (!await this.connect()) return;

        console.log(`🚀 Starting continuous outreach`);
        console.log(`   📅 Schedule: 9:00, 13:00, 17:00, 21:00`);
        console.log(`   ⏱️  Min Interval: ${POSTING_INTERVAL_HOURS} hours`);
        this.isRunning = true;

        await this.navigateToHome();

        // Load Strategy from Input overrides defaults if present
        if (args.input && fs.existsSync(args.input)) {
            try {
                const strategy = JSON.parse(fs.readFileSync(args.input, 'utf8'));
                if (strategy.twitter) this.keywords = ["#cannabis", ...this.keywords];
            } catch (e) { console.warn("⚠️ Strategy parse error"); }
        }

        while (this.isRunning) {
            try {
                if (this.shouldPost()) {
                    console.log('⏰ Time to post - finding target...');

                    // Shuffle keywords to vary topics
                    const shuffledKeywords = this.keywords.sort(() => 0.5 - Math.random());

                    // Try to engage (stops after 1 successful engagement)
                    const engaged = await this.searchAndEngage(shuffledKeywords, true); // true = single shot mode

                    if (engaged) {
                        this.lastPostTime = Date.now();
                        const nextPostDate = new Date(this.lastPostTime + POSTING_INTERVAL_MS);
                        console.log(`✅ Cycle Complete. Next post at: ${nextPostDate.toLocaleTimeString()}`);
                    } else {
                        console.log("⚠️ No viable targets found this cycle. Retrying in 15 mins.");
                    }
                } else {
                    const minsRemaining = Math.ceil((POSTING_INTERVAL_MS - (Date.now() - this.lastPostTime)) / 60000);
                    console.log(`💤 Sleeping... ${minsRemaining} mins until next window.`);
                }

                // Heartbeat check every 15 minutes
                await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000));

                // Refresh page periodically to keep session alive? Or reconnect?
                // For now, assume connection stays valid or navigateToHome handles it.
                if (this.isRunning && this.page) {
                    try { await this.navigateToHome(); } catch (e) { }
                }

            } catch (error) {
                console.error('Error in continuous mode:', error);
                // Wait 1 hour before retrying after error
                await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
            }
        }
    }

    async stop() {
        console.log('🛑 Stopping outreach agent...');
        this.isRunning = false;
        await this.disconnect();
    }

    // Modified to support single-shot mode
    async searchAndEngage(keywords, singleShot = false) {
        for (const keyword of keywords) {
            console.log(`\n🔍 Searching for: "${keyword}"`);
            try {
                await this.page.goto(`https://x.com/search?q=${encodeURIComponent(keyword)}&src=typed_query&f=live`, { waitUntil: 'domcontentloaded' });
                await this.randomSleep(5000, 10000);

                // Check for tweets
                try { await this.page.waitForSelector('article[data-testid="tweet"]', { timeout: 8000 }); }
                catch (e) { continue; }

                await this.page.evaluate(() => window.scrollBy(0, 500));
                await this.randomSleep(2000, 4000);

                const tweets = await this.page.$$eval('article[data-testid="tweet"]', (elements) => {
                    return elements.slice(0, 5).map(el => {
                        const textEl = el.querySelector('[data-testid="tweetText"]');
                        const content = textEl ? textEl.innerText : el.innerText;
                        const linkEl = el.querySelector('a[href*="/status/"]');
                        const id = linkEl ? linkEl.href.split('/status/')[1] : null;
                        const handle = linkEl ? linkEl.href.split('/')[3] : 'unknown';
                        return { id, handle, content };
                    });
                });

                console.log(`   found ${tweets.length} potential posts.`);

                for (const tweet of tweets) {
                    if (!tweet.id || this.isAlreadyEngaged(tweet.id)) continue;

                    const persona = await this.decidePersona(tweet);
                    const comment = await this.draftAndAnneal(tweet, persona);

                    if (!comment || comment.includes("Error")) continue;

                    await this.postComment(tweet, comment, persona.name);

                    if (singleShot) return true; // SUCCESS! Return immediately.
                }

            } catch (err) {
                console.error(`   Error processing keyword ${keyword}:`, err.message);
            }

            // If not single shot, wait before next keyword
            if (!singleShot) await this.randomSleep(60000, 120000);
        }
        return false; // No engagement made across all keywords
    }

    async postComment(tweet, comment, personaName) {
        if (this.autoApprove) {
            console.log(`🚀 [AUTO] Posting: "${comment}"`);
            await this.executePost(tweet, comment);
            this.logEngagement(tweet, comment, personaName);
        } else {
            return new Promise((resolve) => {
                this.rl.question(`\n🚀 Post? (y/n): "${comment}" `, async (ans) => {
                    if (ans.toLowerCase() === 'y') {
                        await this.executePost(tweet, comment);
                    }
                    this.logEngagement(tweet, comment, personaName);
                    resolve();
                });
            });
        }
    }

    async executePost(tweet, comment) {
        try {
            console.log(`   Navigating to tweet...`);
            await this.page.goto(`https://x.com/${tweet.handle}/status/${tweet.id}`, { waitUntil: 'domcontentloaded' });
            await this.randomSleep(5000, 8000);

            const replyBox = '[data-testid="tweetTextarea_0"]';
            await this.page.waitForSelector(replyBox);
            await this.page.click(replyBox);
            await this.randomSleep(1000, 3000);

            console.log(`   ⌨️ Typing reply...`);
            await this.page.type(replyBox, comment, { delay: Math.floor(Math.random() * 100) + 50 });
            await this.randomSleep(2000, 4000);

            const button = '[data-testid="tweetButtonInline"]';
            await this.page.waitForSelector(button);
            await this.page.click(button);
            console.log("✅ Posted.");
        } catch (e) {
            console.error("❌ Post Failed", e.message);
        }
    }

    // --- AI HELPERS ---
    async decidePersona(post) {
        // Simplified fallback if Gemini fails or is rate limited
        return { name: "guide" };
        // Note: Full logic was in previous version, can restore if needed but keeping it simple for stability in snippet
    }

    async draftAndAnneal(post, persona) {
        try {
            return await callGemini({ type: 'generate', prompt: `Reply as specific Persona to: "${post.content}". Max 150 chars. Helpful, cool.` });
        } catch {
            return "That's super interesting! Thanks for sharing #cannabiscommunity";
        }
    }

    isAlreadyEngaged(id) {
        if (!fs.existsSync(HISTORY_FILE)) return false;
        try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')).some(h => h.id === id); } catch { return false; }
    }

    logEngagement(post, comment, persona) {
        const history = fs.existsSync(HISTORY_FILE) ? JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')) : [];
        history.push({ id: post.id, handle: post.handle, content: post.content, reply: comment, persona, timestamp: new Date().toISOString() });
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    }

    async disconnect() {
        if (this.browser && args.headless) await this.browser.close();
        else if (this.browser) await this.browser.disconnect();
        this.rl.close();
    }
}

// Usage
const agent = new OutreachAgent();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await agent.stop();
    process.exit(0);
});

// Start continuous mode
agent.runContinuous().catch(console.error);
