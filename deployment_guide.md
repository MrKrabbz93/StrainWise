# StrainWise Production Deployment Guide

Follow these steps to move the StrainWise Intelligence Suite from development to a stable production environment.

## 1. Primary Method: Docker Orchestration (Highly Recommended)
Since the project includes background agents (Outreach, Marketing) and a worker service, **Docker** is the best way to keep all systems running in sync.

1.  **Configure `.env`**: Ensure all keys (Anthropic, Gemini, Supabase) are set in your local `.env`.
2.  **Build & Launch**:
    ```bash
    docker-compose up --build -d
    ```
3.  **Verify**: Access the dashboard at `http://localhost:4173`.
4.  **Admin Setup**: Manually set your account type to 'admin' in Supabase to access Mycelium HQ.

---

## 2. Infrastructure & Environment Variables
Ensure the following variables are set in your `.env` (passed to Docker via `env_file`):

| Variable | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Frontend connection to DB |
| `ANTHROPIC_API_KEY` | Required for Claude 4.6 (OpenRouter supported) |
| `GEMINI_API_KEY` | Required for Gemini 2.5 |
| `SUPABASE_SERVICE_ROLE_KEY` | Used for Sentinel/Audit jobs |

---

## 3. Alternative: Vercel & Railway
Use this path ONLY if you want to split the frontend from the background agents.
- **Frontend**: Link repository to **Vercel**.
- **MCP Servers/Agents**: Deploy `mcp_server.mjs` and Docker agents to **Railway** or **Render**.

---
*The platform is now ready for global pioneers.*
