---
description: Harvest Australian Medical Cannabis Dispensaries via AI Research
---

# AU Dispensary Harvest Workflow

This workflow automatically searches for, validates, and indexes medical cannabis dispensaries across major Australian cities, starting with Perth.

## Prerequisites
- `OPENAI_API_KEY` must be set in `.env`
- `TAVILY_API_KEY` must be set in `.env`
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be set.

## Steps

1. **Wait for Migration (Auto-Handled)**
   The script `harvest_dispensaries_au.mjs` automatically checks for the existence of the `dispensaries` table and creates it if it doesn't exist.

2. **Run the Harvest Script**
   Execute the Node.js script to begin the scraping process.
   
// turbo
   ```bash
   node scripts/harvest_dispensaries_au.mjs
   ```

3. **Verify Data**
   Check the `dispensaries` table in Supabase to see the newly indexed locations.

## Regions Covered
- Perth (WA) [Priority]
- Adelaide (SA)
- Melbourne (VIC)
- Sydney (NSW)
- Brisbane (QLD)
- Hobart (TAS)
- Canberra (ACT)
- Darwin (NT)
