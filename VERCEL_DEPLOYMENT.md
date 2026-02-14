# 🚀 Vercel Deployment Guide: StrainWise

This guide walks you through deploying StrainWise to your Vercel team at **https://vercel.com/strain-wise-technical**.

---

## Prerequisites

- [x] GitHub repository: `MrKrabbz93/StrainWise` (already pushed)
- [x] Vercel account with access to `strain-wise-technical` team
- [x] Domain: `strainwise.app` (ready to connect)
- [x] Supabase database (already configured)

---

## Step 1: Import Project to Vercel

1. **Navigate to Vercel Dashboard**
   - Go to: https://vercel.com/strain-wise-technical
   - Click **"Add New..."** → **"Project"**

2. **Import Git Repository**
   - Select **"Import Git Repository"**
   - Choose **GitHub** as the provider
   - Search for: `MrKrabbz93/StrainWise`
   - Click **"Import"**

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

---

## Step 2: Environment Variables

In the **Environment Variables** section, add the following variables from your `.env` file:

### Required Variables

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `VITE_SUPABASE_URL` | `https://ujhqqkbdkqiyoasdeunj.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_Eaa3bFkeekHRgIsmTMZ_Zg_Uvag6AtW` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Service role key (from .env) |
| `DATABASE_URL` | `postgresql://postgres.ujhqqkbdkqiyoasdeunj...` | Pooled connection |
| `DIRECT_URL` | `postgresql://postgres:Artisalba2025!@db...` | Direct connection |
| `GEMINI_API_KEY` | `AIzaSyAW7b3lpDBQ5Uvbe8ROfJMutUn7Xl56SO0` | Google AI API key |
| `ANTHROPIC_API_KEY` | `sk-or-v1-7a42592d0769fd0cb2c73c25...` | Anthropic API key |
| `OPENAI_API_KEY` | `sk-proj-JvenfrZSjrZtX4Mw79dshMgws458...` | OpenAI API key |

> **Important**: Set all variables for **Production**, **Preview**, and **Development** environments.

---

## Step 3: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (2-5 minutes)
3. Vercel will provide a deployment URL like: `https://strainwise-xyz123.vercel.app`

---

## Step 4: Connect Custom Domain

1. **Navigate to Project Settings**
   - Go to your deployed project
   - Click **"Settings"** → **"Domains"**

2. **Add Domain**
   - Enter: `strainwise.app`
   - Click **"Add"**

3. **Configure DNS**
   - Vercel will provide DNS instructions
   - Add the following records to your domain registrar:
     - **Type**: `A` or `CNAME`
     - **Name**: `@` (for root domain)
     - **Value**: Vercel's provided value

4. **Add WWW Subdomain** (Optional)
   - Add: `www.strainwise.app`
   - Configure to redirect to `strainwise.app`

5. **Wait for SSL**
   - Vercel automatically provisions SSL certificates
   - This may take 5-10 minutes

---

## Step 5: Configure Vercel Cron Jobs

Your `vercel.json` already includes cron job configurations. Verify they're active:

1. **Navigate to Project Settings**
   - Click **"Settings"** → **"Cron Jobs"**

2. **Verify Scheduled Functions**
   - `Daily Research`: Runs at 2:00 AM UTC daily
     - Endpoint: `/api/cron/daily-research`
   - `Ranking Updates`: Runs at 3:00 AM UTC daily
     - Endpoint: `/api/cron/update-rankings`

3. **Test Cron Jobs** (Optional)
   - You can manually trigger cron jobs from the Vercel dashboard
   - Or use: `curl https://strainwise.app/api/cron/daily-research`

---

## Step 6: Verify Deployment

### 1. Health Check
Visit: `https://strainwise.app/api/status`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-15T00:00:00.000Z",
  "services": {
    "database": "connected",
    "ai_engine": "operational"
  }
}
```

### 2. Frontend Check
- Visit: `https://strainwise.app`
- Verify the tutorial overlay appears
- Check that all images load correctly

### 3. Authentication Check
- Try signing up/logging in
- Verify Supabase authentication works

### 4. Community Features
- Create a test journal entry
- Verify it appears in the community feed

---

## Step 7: Background Agents (Railway/Render)

Your `outreach-agent` and other background workers need a persistent container service.

### Option A: Railway

1. **Connect Repository**
   - Go to: https://railway.app
   - Click **"New Project"** → **"Deploy from GitHub repo"**
   - Select: `MrKrabbz93/StrainWise`

2. **Configure Service**
   - Railway will auto-detect `docker-compose.yml`
   - Select the `outreach-agent` service

3. **Add Environment Variables**
   - Copy all variables from Vercel
   - Ensure `VITE_SUPABASE_URL`, API keys, etc. are set

4. **Deploy**
   - Railway will build and deploy the Docker container
   - Set restart policy to **"Always"**

### Option B: Render

1. **Create New Web Service**
   - Go to: https://render.com
   - Click **"New +"** → **"Web Service"**
   - Connect GitHub: `MrKrabbz93/StrainWise`

2. **Configure**
   - **Docker Command**: Use `docker/Dockerfile.outreach`
   - **Environment**: Add all variables from Vercel

3. **Deploy**
   - Render will build and deploy
   - Set to **"Always On"** (not free tier)

---

## Troubleshooting

### Build Fails

**Issue**: TypeScript errors during build
**Solution**: Ensure all recent fixes are pushed to GitHub
```bash
git pull origin main
git push origin main
```

### API Routes Return 404

**Issue**: Vercel can't find API routes
**Solution**: Verify `vercel.json` rewrites are correct
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" }
  ]
}
```

### Environment Variables Not Working

**Issue**: Variables not accessible in production
**Solution**: 
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Ensure all variables are set for **Production** environment
3. Redeploy the project

### Domain Not Resolving

**Issue**: `strainwise.app` shows "Domain not found"
**Solution**:
1. Check DNS propagation: https://dnschecker.org
2. Verify DNS records match Vercel's instructions
3. Wait 24-48 hours for full propagation

---

## Post-Deployment Checklist

- [ ] Vercel deployment successful
- [ ] Custom domain `strainwise.app` connected
- [ ] SSL certificate active (HTTPS)
- [ ] `/api/status` returns healthy
- [ ] Tutorial images load correctly
- [ ] Authentication works (sign up/login)
- [ ] Community feed displays journals
- [ ] Cron jobs scheduled and active
- [ ] Background agents deployed (Railway/Render)
- [ ] Admin console accessible

---

## Monitoring & Maintenance

### Vercel Analytics
- Enable in: Settings → Analytics
- Monitor page views, performance, and errors

### Logs
- View real-time logs in: Deployments → [Latest] → Logs
- Check for API errors or failed requests

### Supabase Monitoring
- Monitor database usage in Supabase Dashboard
- Check RLS policy performance
- Review authentication logs

---

**Your StrainWise platform is now live at `strainwise.app`!** 🌿✨

For support, check:
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Railway Docs: https://docs.railway.app
