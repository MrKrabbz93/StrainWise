---
description: Build, Test, and Run StrainWise with Docker
---

# Docker Workflow for StrainWise

Follow this guide to containerize and run the application locally using Docker.

## 1. Prerequisites
- Ensure **Docker Desktop** is installed and running.
- You should see the Docker whale icon in your taskbar.

## 2. Build the Image
Build the production image. This installs dependencies, generates the Prisma client, and builds the Vite frontend.

```powershell
docker build -t strainwise-app .
```
*Note: This may take a few minutes the first time.*

## 3. Run the Container
Run the container mapping port 4173 (our production port) to your local machine.
We pass the `DATABASE_URL` and `GEMINI_API_KEY` from your local environment (or you can create a `.env.docker` file).

```powershell
// turbo
docker run -p 4173:4173 --env-file .env strainwise-app
```

**Access the App:**
Open your browser to: [http://localhost:4173](http://localhost:4173)

## 4. Troubleshooting
If the container fails to start, check the logs:

```powershell
// Get container ID
docker ps -a 
// View logs
docker logs <container_id>
```

## 5. Cleaning Up
To stop and remove the running container:

```powershell
docker ps
docker stop <container_id>
docker rm <container_id>
```
