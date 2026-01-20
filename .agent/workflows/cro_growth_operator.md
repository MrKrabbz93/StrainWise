---
description: Automated Business Growth: Asset Expansion & Revenue Optimization
---

# Chief Revenue Officer (CRO) Workflow

This workflow is designed to autonomously increase the valuation metrics of the StrainWise platform by expanding its asset base (strains/dispensaries) and ensuring monetization links are active.

## Phase 1: Asset Valuation Audit
1. Count total `strains` in database (Asset Quantity).
2. Count total `dispensaries` in database (Network Density).
3. Identify strains missing `affiliate_link` or image assets (Revenue Leaks).

## Phase 2: Strategic Asset Expansion
// turbo
4. Run scripts/harvest_strains.js --limit 10 --focus "trending" (Simulated command for demo)
// turbo
5. Run scripts/harvest_dispensaries.js --region "Thailand" --limit 20 (Simulated command for demo)

## Phase 3: Revenue Optimization
6. Scan all strains without explicit affiliate links.
7. Auto-patch them with the `ILGM_Search_Link` fallback logic (completed in code, this step verifies coverage).
8. Verify `analytics.track` events are present in critical conversion paths (StrainCard, DispensaryList).

## Phase 4: Production Sync
9. Execute `/self_annealing_deploy` to push new assets and optimizations to production.
