---
description: Full application scan, optimization, and deployment pipeline.
---

# Phase 1: Environmental & Configuration Audit
1. Check that `.env` exists and contains all keys from `.env.example`.
2. Verify `package.json` scripts are correct for the current project structure.
3. Check `vite.config.js` and `tailwind.config.js` for misconfigurations.

# Phase 2: Static Analysis & Logic Verification
4. Run `npm run lint` to identify code quality issues.
5. Verify `server.js` maps to existing API files in `api/`.
6. Audit critical stores (e.g., `ui.store.ts`) for type safety (fix previously identified implicit any).

# Phase 3: Build & Test
7. Run `npm run build` to verify the application bundles correctly.
8. (Optional) Run any unit tests if available.

# Phase 4: Deployment
9. Run `npm run deploy` (or `antigravity deploy`) to push the application.
