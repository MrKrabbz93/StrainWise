# ⚡ Force Vercel Redeploy - Quick Guide

The AI fix is in GitHub but **Vercel needs to rebuild** for it to go live.

## Option 1: Automatic Redeploy (Wait)
Vercel should auto-deploy within 2-5 minutes of the push. Check: https://vercel.com/strain-wise-technical

## Option 2: Manual Redeploy (Instant)

### Steps:
1. Go to: https://vercel.com/strain-wise-technical
2. Click on your **StrainWise** project
3. Click **"Deployments"** tab
4. Find the **latest deployment** (should show commit `d4277af`)
5. Click the **three dots (•••)** on the right
6. Click **"Redeploy"**
7. Wait 2-3 minutes for build to complete

## Option 3: Git Push (Trigger New Build)

If the deployment isn't showing the latest commit, push an empty commit:

```bash
cd d:\cannabis-consultant
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin main
```

This will force Vercel to rebuild with the latest AI fixes.

## How to Verify Fix is Live

1. Go to: https://strainwise.app
2. Open the AI Consultant
3. Ask: **"Are there any dispensaries near me that have Zkittlez in stock?"**

### Expected Response (Fixed):
> "Let me help you find that! Open the 'Dispensary Map' tab in StrainWise to see real-time inventory for Zkittlez at nearby locations."

### Wrong Response (Not Deployed Yet):
> "I can't access real-time data. I recommend checking local dispensary websites..."

---

**Current Status:**
- ✅ Code pushed to GitHub (commit `d4277af`)
- ⏳ Waiting for Vercel to redeploy
- ❌ Not live yet (based on your test)

**Recommended Action:** Use Option 2 (Manual Redeploy) for instant deployment.
