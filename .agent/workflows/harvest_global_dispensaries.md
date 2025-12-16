---
description: Deep Global Dispensary Research (Multi-Country)
---

# Global Dispensary Deep Search

This workflow runs an advanced, deep-scan research process to populate the `dispensaries` table with clinics, pharmacies, and dispensaries from legal cannabis markets worldwide.

## Features
- **Multi-Country Support**: Australia, Canada, UK, Germany, Thailand, New Zealand.
- **Deep Search**: Uses 4 distinct search query variations per city to ensure maximum discovery (e.g. "clinics", "pharmacies", "prescribers").
- **AI-Powered Extraction**: Uses GPT-4o-mini to parse search results into structured data.

## Prerequisites
- `OPENAI_API_KEY`
- `TAVILY_API_KEY`
- `SUPABASE_URL`

## Execution

1. **Ensure Country Schema Exists** (One time)
   // turbo
   ```bash
   node scripts/migrate_dispensaries_country.js
   ```

2. **Run the Global Harvest**
   // turbo
   ```bash
   node scripts/harvest_global_dispensaries.mjs
   ```

## Customization
To add more countries or cities, edit the `LOCATIONS` constant in `scripts/harvest_global_dispensaries.mjs`.
