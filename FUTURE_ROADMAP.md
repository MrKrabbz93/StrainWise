# StrainWise: Future Roadmap & Strategic Next Steps

## Strategic Direction: Hybrid Architecture
- **Frontend**: Deployed on **Vercel** for speed, global CDN, and superior developer experience.
- **Backend**: Containerized via **Docker** for robust processing, queuing, and scalability.

## 1. Immediate Priority: Asynchronous Processing (Queuing) [DONE]
**Goal:** Offload heavy AI tasks to prevent timeouts and ensure reliability.
**Technology:** **Supabase PGMQ** (Postgres Message Queue).
- *Reasoning*: Leverages existing database infrastructure, zero extra cost/maintenance compared to Redis.
- **Implementation Status**:
  - [x] Enable `pgmq` extension in Supabase.
  - [x] Create `ai_job_queue` and `ai_job_results` table.
  - [x] Implement `QueueService` and `ai-worker.js`.
  - [x] Update API endpoints (`api/jobs`) and Frontend (`StrainLibrary`) to use queue.

## 2. Performance Optimization
### Response Caching
Implement `response_cache` table in Supabase (as defined previously) to serve common AI queries instantly.

## 3. User Feedback & Analytics
- **Feedback Loop**: Simple "Was this helpful?" boolean on recommendations.
- [DONE] **Analytics**: Integrate **PostHog** for privacy-focused user behavior tracking.

## 4. Feature Expansion
- [DONE] **Strain Journals**: capture user experiences.
- [DONE] **Dispensary Integration**: Pilot program & Geo-location service.
- **Community Hub**: Public feed of journals, "Connoisseur" badges, and strain trending.

## 5. Deployment & DevOps
- **Docker**: Maintain `node:20` based image.
- **CI/CD**: Set up GitHub Actions to build/push Docker image on main branch merge.

---
*Status: Hybrid Architecture Adopted. Docker Backend Active.*
