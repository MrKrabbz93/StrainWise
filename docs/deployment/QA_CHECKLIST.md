# StrainWise Release Candidate - QA & Launch Checklist

Before final submission to the App Store or Play Store, perform the following quality assurance checks.

## 📱 Visual & UI Check
- [ ] **Notch/Dynamic Island Check**: Ensure the header doesn't overlap with the system status bar (check `viewport-fit=cover`).
- [ ] **Touch Targets**: Verify all buttons in `CommunityFeed` and `JournalEntry` are at least 44x44px.
- [ ] **Dark Mode Consistency**: Check that all modals (Auth, Settings, Tutorial) maintain the premium dark palette.
- [ ] **Age Gate**: Ensure the Age Gate appears on fresh install and persists correctly.

## ⚙️ Functionality Check
- [ ] **AI Consultation**: Verify all three personas (Guide, Scientist, Connoisseur) return accurate responses on mobile.
- [ ] **Camera / Scan (Beta)**: Test access to camera permissions in the Capacitor environment.
- [ ] **Authentication**: Test Signup/Login flow specifically on mobile browsers and native wrappers.
- [ ] **Referrals**: Verify that copying the referral link works as expected on mobile devices.

## 🛰️ Network & Performance
- [ ] **Offline Loading**: Verify PWA service worker caches the core app skeleton for offline start.
- [ ] **Asset Size**: Ensure images in the `StrainEncyclopedia` use WebP or optimized JPGs.
- [ ] **Supabase Connectivity**: Verify RLS policies are working correctly in a production environment.

## ⚖️ Legal & Compliance
- [ ] **Privacy Policy**: Link in the footer must open a readable page.
- [ ] **Terms of Service**: Must include medical disclaimers prominently.
- [ ] **Age Verification**: Strictly enforced (21+).

## 🚀 Submission Final Steps
1. **Sync Capacitor**: Run `npx cap sync` to update native projects.
2. **Build Production**: Run `npm run build` to generate the `/dist` folder.
3. **Generate Assets**: Ensure icons in `/icons` match the premium branding.
4. **App Store Connect**: Upload the `.aab` (Android) or Archive (iOS) and fill metadata from `STORE_LISTING.md`.
