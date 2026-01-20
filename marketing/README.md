# B2B Outreach Toolkit

This directory contains the assets and tools needed to execute the **StrainWise B2B Growth Strategy**.

## 📂 Campaign Assets
- **`templates/b2b_outreach_th.md`**: Email template for **Thailand**. Focuses on "Medical Tourism" and "Menu Accuracy".
- **`templates/b2b_outreach_au.md`**: Email template for **Australia**. Focuses on "TGA Compliance" and "Patient Access".

## 🛠️ Scripts (in `/scripts`)

### 1. Lead Exporter (`usage: node scripts/export_leads.js`)
- **Purpose**: Extracts high-quality leads from the Supabase database.
- **Filters**:
    - Country: Thailand & Australia
    - Quality: Must have Website or Phone
- **Output**: Generates `leads_export.csv` (Ready for Mailchimp/SendGrid).

### 2. Outreach Simulator (`usage: node scripts/outreach_simulator.js`)
- **Purpose**: Validates your email templates against real database data.
- **Function**:
    - Fetches 2 random leads from each target region.
    - Merges them with the correct markdown template.
    - Prints the final email body to the console for review.
- **Use Case**: Run this before every new campaign to ensure merge tags (`{Business Name}`) are working correctly.

## 🚀 Workflow
1.  Run `node scripts/harvest_global_dispensaries.mjs` to get fresh data.
2.  Run `node scripts/analyze_harvest.js` to check data quality.
3.  Run `node scripts/export_leads.js` to get your CSV.
4.  Upload CSV to your Email Marketing Platform.
5.  Copy/Paste templates from `marketing/templates/`.
