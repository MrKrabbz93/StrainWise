# StrainWise Project Handover Guide

This document is prepared for **GLM-4.6** to facilitate a smooth takeover of the **StrainWise** project. It contains the project context, technical stack, database schema, and recent architectural changes.

## 1. Project Overview
**StrainWise** is a premium, AI-powered cannabis consultant application. It creates a personalized "Connoisseur" experience for users to discover strains, get medical advice, and track their cannabis journey.

### Key Features
*   **AI Consultant:** A chat interface `AIService` supporting hybrid **OpenAI GPT-5.2** (primary) and Gemini. Features **AI Response Caching** and **Monetization Triggers** (Affiliate Links).
*   **Strain Archives:** A 3D "Hallway" carousel with manual scrolling and image-first sorting. Includes a "Focus View" for deep dives.
*   **Global Dispensary Network:** Use `/dispensaries` to find clinics & pharmacies.
*   **Community Hub:** Public `CommunityFeed.jsx` where users share journals and reviews.
*   **Monetization Layer:** Integrated Affiliate Support for Seeds (ILGM), Hardware (Vapor.com), and CBD (CBDfx).

## 7. Current Status & Handover Notes
*   **Status**: **DEPLOYED & STABLE (v1.2)**.
*   **Deployment**: Hosted on **Vercel** (`https://strainwise.app`).
*   **Traffic Stats**: Live users engaging with new "Buy Genetics" CTAs.
*   **Recent Upgrades**:
    *   **Monetization**: Complete Affiliate engine integrated into `StrainCard.jsx` and `gemini.js` (AI Prompts).
    *   **UI/UX**: Replaced marquee with manual carousel functionality in Archives.
    *   **Compliance**: Added "Beta Access" disclaimer step to `TutorialOverlay.jsx` and removed misleading "Gen Art" buttons.
    *   **Coming Soon**: "Locate Nearby" features are temporarily disabled with "Coming Soon" badges until global inventory data is fully ready.

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
    *   `is_public` (boolean), `tutorial_completed` (boolean)
    *   `xp` (int), `rank` (text), `badges` (text[]) - *Gamification*

2.  **`public.strains`** (The Encyclopedia)
    *   `id`, `name`, `description`, `type`, `thc`, `image_url`
    *   `effects`, `terpenes`, `medical` (ARRAYS)
    *   `affiliate_link` (text) - *New Field recommended for direct overrides*

3.  **`public.chat_history`**
4.  **`public.favorites`**
5.  **`public.dispensaries`**
6.  **`public.strain_journals`**

## 4. Key File Manifest

### `src/lib/gemini.js` (The Brain & Salesman)
*   **Status:** Advanced.
*   **Updates:**
    *   **System Prompt Injection**: Now contains specific logic to detect "growing", "vaping", or "CBD" intent and injects affiliate links for ILGM, Vapor.com, etc.
    *   `generateResponse()`: Multi-persona chat (Scientist/Connoisseur).

### `src/components/StrainLibrary.jsx` & `StrainCard.jsx`
*   **Status:** Polished.
*   **Features:**
    *   **Manual Carousel**: "Hallway View" uses snap-scrolling.
    *   **Sort Logic**: Prioritizes strains with images (`sorted`).
    *   **Affiliate CTA**: Renders "Buy Genetics" button linking to ILGM.
    *   **Safety**: "Locate Nearby" disabled with "Coming Soon" overlay.

### `src/components/TutorialOverlay.jsx`
*   **Status:** Updated.
*   **Features:** Includes new "Beta Access" disclaimer slide.

## 5. Environment Variables
Ensure the following are set in `.env` (Local) and Deployment Environment Variables:
```bash
VITE_GEMINI_API_KEY=AIzaSy...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (Required for Backend API)
```

## 6. Deployment Guide
1.  **Repo**: `mrkrabbz93/StrainWise`
2.  **Host**: Vercel
3.  **Command**: `npm run build` (Automatically triggers `vite build` + `prisma generate`)
4.  **Production URL**: [https://strainwise.app](https://strainwise.app)



