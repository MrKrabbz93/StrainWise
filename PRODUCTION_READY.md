# 🏗️ Production Readiness: StrainWise.app

This document provides the final checklist and steps required to move the StrainWise platform from your local environment to your live domain: **strainwise.app**.

## 🚀 Frontend & API (Vercel)

Vercel will handle your user interface and main API logic (located in the `/api` directory).

### 1. Repository Setup
- Push your current code to a private GitHub repository.
- Connect the repository to Vercel at [vercel.com/new](https://vercel.com/new).

### 2. Environment Variables (Vercel Dashboard)
You MUST add the following variables to your Vercel Project Settings:

| Key | Value Source |
| :--- | :--- |
| `VITE_SUPABASE_URL` | From your `.env` |
| `VITE_SUPABASE_ANON_KEY` | From your `.env` |
| `GEMINI_API_KEY` | Your Google AI Studio Key |
| `ANTHROPIC_API_KEY` | Your Anthropic Key |
| `OPENAI_API_KEY` | Your OpenAI Key |

### 3. Domain Linking
- In Vercel: `Settings` -> `Domains` -> Add `strainwise.app`.
- Follow the DNS instructions to point your domain to Vercel.

---

## 🛰️ Background Agents (Railway / Render)

Your `outreach-agent` requires a persistent Docker environment (not serverless).

### 1. Deployment Method
- **Option A (Railway)**: Connect your GitHub repo to Railway.app. It will detect the `docker-compose.yml` automatically.
- **Option B (Render)**: Create a new "Web Service" (or Private Service) from your repo and select the `docker/Dockerfile.outreach`.

### 2. Required Setup
- **Shared Secrets**: Ensure the same Supabase and AI keys from the table above are added to the Railway/Render environment.
- **Restart Policy**: Set to `Always` to ensure your marketing agents stay active even after errors.

---

## 🛡️ Database & Security

### 1. Final Schema Verification
Before launching, ensure all migrations are applied. Use the SQL editor in Supabase to run:
- [supabase_community_schema.sql](file:///d:/cannabis-consultant/supabase_community_schema.sql)

### 2. Storage Buckets
If using avatar uploads, ensure your Supabase storage bucket `avatars` is created and set to **Public**.

---

## ✅ Deployment Checklist
- [ ] Vercel build status: **Success**
- [ ] `strainwise.app` SSL: **Active**
- [ ] `outreach-agent` logs: **Running/Polling**
- [ ] Database Connection: **Verified via /api/status**

---
**Your platform is now ready for global intelligence orchestration. Proceed with deployment.**
