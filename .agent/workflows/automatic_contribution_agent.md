---
description: Automated Daily Research & Contribution Workflow
---

# Cannabis Data Harvesting & Gamification Workflow

This workflow automates the process of gathering new cannabis data from the web (Strains) and validates user contributions (Dispensaries), rewarding them with XP.

## 1. Web Scraping & Research Agent (Daily Cron)

**Agent:** `api/cron/daily-research.js`
**Schedule:** Daily @ 9:00 AM UTC (via Vercel Cron)

**Workflow Steps:**
1.  **Duplicate Check**: Agent fetches all existing strain names from Supabase to ensure uniqueness.
2.  **Web Scrape**: Uses **Tavily API** to search targeted forums:
    *   `reddit.com/r/trees`
    *   `reddit.com/r/cannabis`
    *   `leafly.com/news`
    *   Queries: "new strains 2025", "fresh drops", "exotic strain reviews"
3.  **Gemini Analysis**:
    *   Parses search results (HTML/Text).
    *   Identifies ONE high-confidence new verified strain.
    *   Extracts `source_url`.
4.  **Schema Generation**:
    *   Generates full profile: `description`, `thc`, `effects`, `terpenes`, `visual_profile`.
5.  **Database Injection**:
    *   Inserts into `strains` table.
    *   Sets `is_verified` = true.
    *   Sets `submitted_by` = null (System Agent).

## 2. Dispensary Verification Agent (On-Demand)

**Agent:** `api/add-dispensary.js`
**Trigger:** User submits "Add Dispensary" form from Frontend.

**Workflow Steps:**
1.  **Receive Payload**: `name`, `address`, `city`, `state`, `website`, `user_id`.
2.  **Existence Check**:
    *   Agent queries **Tavily API** with `${name} dispensary ${address}`.
    *   Verifies if a matching business footprint exists online.
3.  **Database Entry**:
    *   Adds to `dispensaries` table.
    *   Sets `lat/lng` (Future: Geocoding).
4.  **Gamification Loop**:
    *   Fetches User Profile (`xp`, `contributions_count`).
    *   **XP Calculation**: Base +20 XP.
    *   **Milestone Check**: If `(count + 1) % 5 == 0` -> Add +100 Bonus XP.
    *   Updates User Profile.
5.  **Feedback**: Returns success message and `earned_xp` to UI.

## 3. Maintenance

*   **Logs**: Check Vercel Function logs for `Daily Research Agent` output.
*   **Errors**: If Tavily fails, agent aborts gracefully. If Gemini fails parsing, agent retries next cycle.
