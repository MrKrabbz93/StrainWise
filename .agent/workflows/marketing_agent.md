---
description: Run the Self-Annealing Social Media Marketing Agent
---

### 🧬 StrainWise Marketing Agent (Self-Annealing)

This workflow triggers the agentic loop that researches community trends, generates viral content, self-critiques its own work, and posts it to social media.

#### 🛠️ Setup
1. Fill in your credentials in `.env.marketing` (see `.env.marketing.example`).
2. Ensure you have Playwright installed.

// turbo
3. Install dependencies:
```bash
npm install playwright dotenv
npx playwright install chromium
```

#### 🚀 Execution
Run the agent:
```bash
node scripts/marketing_agent.js
```

#### 🔄 What the Agent Does:
1. **Observation**: Scans your database for trending strains and recent community "vibes."
2. **Strategy Generation**: Decides on a hook and creates a multi-platform plan (X, IG, TikTok, FB).
3. **Self-Annealing (Critique)**: The agent acts as its own editor, rating the content and refining it until it hits a 8/10 or higher quality score.
4. **Distribution**: Uses Playwright to open an automated browser, log into your accounts, and distribute the approved content.

#### ⚠️ Note
Automating social media logins can be flagged by platform security. It is recommended to run this in non-headless mode (`headless: false` in the script) the first few times to handle any CAPTCHAs or 2FA prompts manually in the browser window.
