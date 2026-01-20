import 'dotenv/config';
import handler from '../api/cron/daily-research.js';

// Mock Express Request/Response
const req = {};
const res = {
    status: (code) => ({
        json: (data) => console.log(`[${code}] Response:`, JSON.stringify(data, null, 2))
    })
};

console.log("🧪 Running Test: Daily Research Agent...");
handler(req, res).then(() => console.log("✅ Test Complete."));
