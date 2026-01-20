---
description: Intelligent Community Outreach & Engagement Agent
---

### 🕸️ Mycelium Outreach Agent (Persona-Based Engagement)

This agent searches social media for cannabis-related discussions and interacts with the community using one of the three StrainWise AI personas. It "reads the room" to ensure the tone is perfect.

#### 🛠️ Setup
1. Ensure your social media credentials are in `.env` (or `.env.marketing`).
2. The agent uses `playwright` for automation.

// turbo
3. Install dependencies (if not already done):
```bash
npm install playwright dotenv
npx playwright install chromium
```

#### 🚀 Execution
Run the outreach agent:
```bash
node scripts/outreach_agent.js
```

#### 🎭 How it Works:
1.  **Search**: It scans keywords like `#cannabiscommunity`, `terpene science`, and `strain reviews`.
2.  **Room Analysis**: For every interesting post, it analyzes the "vibe" and author intent.
3.  **Persona Selection**:
    *   **The Scientist**: Activated for technical or biochemistry questions.
    *   **The Connoisseur**: Activated for flavor, luxury, or sensory posts.
    *   **The Guide**: Activated for wellness, anxiety, or beginner help.
4.  **Self-Annealing Cycle**:
    *   **Drafts** a response that is short, precise, and positive.
    *   **Critiques** itself to ensure it doesn't sound like a bot.
    *   **Refines** the text until it hits a 9/10 quality score.
5.  **Engagement**: Logs in and posts the comment to draw users back to the Mycelium Network.

#### ⚖️ Guidelines
- **Stay Positive**: Every interaction must be supportive of the creator.
- **Stay Short**: No long-form sentences. Keep it under 2 sentences.
- **Stay Human**: Avoid corporate or robotic jargon.
