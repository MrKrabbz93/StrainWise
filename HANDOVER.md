# StrainWise Project Handover Guide

This document is prepared for **GLM-4.6** to facilitate a smooth takeover of the **StrainWise** project. It contains the project context, technical stack, database schema, and recent architectural changes.

## 1. Project Overview
**StrainWise** is a premium, AI-powered cannabis consultant application. It creates a personalized "Connoisseur" experience for users to discover strains, get medical advice, and track their cannabis journey.

### Key Features
*   **AI Consultant:** A chat interface `AIService` supporting hybrid **OpenAI GPT-5.2** (primary) and Gemini. Features **AI Response Caching** for instant replies.
*   **Global Dispensary Network:** Use `/dispensaries` to find clinics & pharmacies in **Australia, UK, Canada, Germany, Thailand, & New Zealand**.
*   **Community Hub:** Public `CommunityFeed.jsx` where users share journals and reviews.
*   **Analytics:** Integrated **PostHog** for granular user behavior tracking.
*   **Gamification:** Users earn XP, Ranks ("Seedling" to "Master Grower"), and Badges.

## 7. Current Status & Handover Notes
*   **Status**: **DEPLOYED & STABLE**.
*   **Deployment**: Hosted on **Vercel** (`https://cannabis-consultant.vercel.app`).
*   **Recent Upgrades**:
    *   **Performance**: `response_cache` table prevents expensive redundant AI calls.
    *   **Data**: `dispensaries` table now holds global records populated by the Deep Harvest agent.
    *   **Social**: `strain_journals` now supports public visibility.
*   **Known Issues**:
    *   Docker build works locally but we pivoted to Vercel for launch speed.
    *   Ensure `OPENAI_API_KEY` is set in Vercel to enable the new extraction features.

*Antigravity (Google Deepmind), signing off. The foundation is rock solid. Good luck.*

## 2. Technical Stack
*   **Frontend:** React 19 + Vite 7
*   **Styling:** Tailwind CSS v4 (PostCSS) + Framer Motion (Animations)
*   **Backend / Database:** Supabase (PostgreSQL) + RLS (Row Level Security)
*   **ORM:** Prisma (PostgreSQL) - *New Architecture Layer*
*   **Caching:** Redis (ioredis) - *Performance Optimization*
*   **AI Engine:** Hybrid Service (Google Gemini `gemini-2.0-flash-exp` + OpenAI `gpt-5.2`)
*   **Mobile:** Capacitor 8 (Android/iOS builds)

## 3. Database Schema (Supabase)
The database uses PostgreSQL with Row Level Security (RLS) enabled.

### Core Tables
1.  **`public.profiles`**
    *   `id` (uuid, PK, refs auth.users)
    *   `username`, `bio`, `avatar_url`, `interests`
    *   `is_public` (boolean)
    *   `xp` (int), `rank` (text), `badges` (text[]) - *Gamification*
    *   `account_type`, `subscription_status`

2.  **`public.chat_history`**
    *   `user_id`, `role` ("user"/"model"), `content`, `persona`.

3.  **`public.favorites`**
    *   `user_id`, `strain_name`, `visual_profile` (color theme).

4.  **`public.community_activity`**
    *   `user_id`, `type` ("rank_up", "review"), `content`, `metadata` (jsonb).

5.  **`public.dispensaries`**
    *   `id`, `name`, `address`, `location` (lat/lng), `active_hours`.

6.  **`public.dispensary_inventory`**
    *   `dispensary_id`, `strain_id`, `price`, `in_stock`.

7.  **`public.strain_journals`**
    *   `user_id`, `strain_id`, `rating`, `effects` (tags), `activity_tags`.

8.  **`public.ai_job_results`**
    *   `msg_id`, `job_type`, `status`, `payload`, `result`, `error_message`.
    *   *Managed by `ai-worker.js` and `pgmq`.*

*Note: PGMQ Queue `ai_job_queue` allows async processing.*

## 4. Key File Manifest

### `src/components/UserProfile.jsx` (Recently Refactored)
*   **Status:** Cleaned up.
*   **Structure:**
    *   **Header:** Displays "Live Preview" of profile data.
    *   **EditProfilePanel:** A dedicated sub-component extracted to the bottom of the file. Handles inputs for Username, Bio, and AI Avatar Generation.
    *   **Tabs:** Favorites, Inbox, Community, Sommelier (AI Recommendations).
*   **Key Logic:** "Nano Banana" AI Avatar generation calls `generateImage` in `gemini.js`.

### `src/lib/gemini.js` (The Brain)
*   **Status:** Advanced.
*   **Capabilities:**
    *   `generateResponse()`: Multi-persona chat (Scientist/Connoisseur).
    *   `identifyStrain()`: Vision API to analyze photos of buds.
    *   `researchStrain()`: Uses Google Search Grounding to hallucinate/find real strain data.
    *   `generateImage()`: Tries to use Imagen 3, falls back to DiceBear if 404.

### `src/lib/` (Infrastructure - New)
*   **`db.ts`**: Prisma Client instance with connection pooling configuration for production scaling (Neon Adapter).
*   **`cache.ts`**: Multi-layer caching service (Redis + LRU Fallback).
*   **`security.ts`**: JWT, Rate Limiting, and Sanitization services.
*   **`api-handler.ts`**: Composable middleware factory for API routes (`withAuth`, `withValidation`).
*   **`services/strain.service.ts`**: Business logic for Strains with integrated caching.

### `api/` (Serverless Functions)
*   **`strains.js`**: Standardized endpoint using `createApiHandler` and Zod validation.
*   **`auth/`**: Authentication endpoints (Skeleton for custom JWT flow).

### `src/App.jsx` & `src/components/Layout.jsx`
*   Main routing and structural layout (Sidebar/Navigation).

### `src/lib/stores/` (State Management)
*   **`user.store.ts`**: Persistent auth state (Zustand).
*   **`strain.store.ts`**: Strain data, filtering, favorites.
*   **`consultant.store.ts`**: Chat sessions, optimistic updates, socket integration.
*   **`ui.store.ts`**: Theme, sidebar, notifications.

### `src/components/` (New Architecture)
*   **`optimized/OptimizedImage.jsx`**: Lazy-loading image component.
*   **`strains/StrainCard.jsx`**: Memoized card with variants.
*   **`consultant/ConsultantChat.jsx`**: Real-time chat UI with animations.

### `src/lib/services/` (Core & Real-Time)
*   **`dispensary.service.ts`**: Geo-location queries & Inventory using Read Replicas.
*   **`recommendation.service.ts`**: Hybrid AI scoring (Feedback + Journal + Activity context).
*   **`activity-pairing.service.ts`**: Pattern recognition for strain-activity synergy.
*   **`job.service.ts`**: Enqueue AI tasks to PGMQ (Server-Side).
*   **`socket.service.ts`**: Websocket client for real-time updates.

### `api/` (Serverless Functions)
*   **`jobs.js`**: Authenticated endpoint to trigger Async AI jobs (POST) and check status (GET).
*   **`strains.js`**: Standardized endpoint using `createApiHandler` and Zod validation.
*   **`auth/`**: Authentication endpoints (Skeleton for custom JWT flow).

### `src/workers/`
*   **`ai-worker.js`**: Background polling worker (Docker enabled) that processes PGMQ jobs via `pop_ai_job`.

## 5. Environment Variables
Ensure the following are set in `.env` (Local) and Deployment Environment Variables:
```bash
VITE_GEMINI_API_KEY=AIzaSy...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_READ_REPLICA_URL=https://... (Optional: Load Balancer / Replica)
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (Required for Backend API)
OPENAI_API_KEY=sk-... (Optional, fallback provider)
AI_PROVIDER=gemini (Default)
DATABASE_URL=postgres://... (Transaction Pooler)
DIRECT_URL=postgres://... (Session Mode for Migrations)
PORT=4173
```

## 6. Deployment Guide

### Option A: Vercel (Recommended for Serverless)
1.  **Push** code to GitHub.
2.  **Import** project in Vercel.
3.  **Config**: Vercel will automatically detect Vite. The `vercel.json` handles API function routing.
4.  **Env Vars**: Copy all variables from `.env` to Vercel Project Settings.

### Option B: Docker / Railway (Recommended for Persistent Server)
1.  **Repo**: Connect GitHub repo to Railway.
2.  **Build**: Railway detects `Dockerfile` automatically.
3.  **Env Vars**: Add all variables in Railway Dashboard.
4.  **Start Command**: `npx tsx server.js` (Defined in Dockerfile).

### Verification
*   **Production URL**: Your deployed Vercel/Railway URL.
*   **Health Check**: Visit `/api/gemini` (Method: OPTIONS or POST) to verify backend connectivity.


