import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env vars immediately - MUST happen before imports that use env vars
dotenv.config();

// API Handlers (Dynamic Import to respect dotenv)
const { default: geminiHandler } = await import('./api/gemini.js');
const { default: strainsHandler } = await import('./api/strains.js');
const { default: addDispensaryHandler } = await import('./api/add-dispensary.js');
const { default: verifyStrainHandler } = await import('./api/verify-and-add-strain.js');
const { default: dailyResearchHandler } = await import('./api/cron/daily-research.js');
const { default: updateRankingsHandler } = await import('./api/cron/update-rankings.js');
const { default: loginHandler } = await import('./api/auth/login.js');
const { default: jobsHandler } = await import('./api/jobs.js');
const { default: strainInfoHandler } = await import('./api/strain-info.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4173;

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' })); // Support large payloads like images

// API Route Wrapper
// Vercel handlers usually are (req, res) => void/Promise
const handle = (handler) => async (req, res) => {
    try {
        await handler(req, res);
    } catch (err) {
        console.error("API Handler Error:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    }
};

// Register Routes
// Note: The paths must match what the frontend expects
app.all('/api/gemini', handle(geminiHandler));
app.all('/api/strains', handle(strainsHandler));
app.all('/api/add-dispensary', handle(addDispensaryHandler));
app.all('/api/verify-and-add-strain', handle(verifyStrainHandler));
app.all('/api/cron/daily-research', handle(dailyResearchHandler));
app.all('/api/cron/update-rankings', handle(updateRankingsHandler));
app.all('/api/auth/login', handle(loginHandler));
app.all('/api/strain-info', handle(strainInfoHandler));
app.all('/api/jobs', handle(jobsHandler));

// Serve Static Assets (Vite Build)
// We serve from 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback
// Any request that isn't an API call or a static file serves index.html
app.get('*', (req, res) => {
    // If asking for a file that doesn't exist (like missing asset with extension), don't return HTML
    if (req.path.includes('.') && !req.path.includes('.html')) {
        return res.status(404).end();
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Production Server running on port ${PORT}`);
    console.log(`- API endpoints ready at /api/*`);
    console.log(`- Serving static frontend from /dist`);
});
