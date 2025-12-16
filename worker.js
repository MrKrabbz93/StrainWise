import { queueService } from './src/lib/services/queue.service.js';
// We might need to import specific services to handle the jobs
// e.g. import { geminiService } from './src/lib/gemini.js'; // Assuming this exists or similar

console.log("🚀 Starting AI Job Worker...");

const WORKER_ID = `worker-${Math.random().toString(36).substring(7)}`;
const POLL_INTERVAL = 1000; // 1 second

async function processJob(job) {
    const { msg_id, message } = job;
    console.log(`[${WORKER_ID}] Processing Job ${msg_id}:`, message.type);

    try {
        // --- JOB DISPATCHER ---
        if (message.type === 'generate_strain_description') {
            // await geminiService.generateDescription(message.strainName);
            console.log(`[${WORKER_ID}] Simulating AI generation for: ${message.strainName}`);
            await new Promise(r => setTimeout(r, 2000)); // Simulate work
        }
        else if (message.type === 'analyze_image') {
            console.log(`[${WORKER_ID}] Simulating Image Analysis...`);
            await new Promise(r => setTimeout(r, 3000));
        }
        else {
            console.warn(`[${WORKER_ID}] Unknown job type: ${message.type}`);
        }

        // --- COMPLETE ---
        console.log(`[${WORKER_ID}] Job ${msg_id} Complete. Archiving...`);
        await queueService.archive(msg_id);

    } catch (err) {
        console.error(`[${WORKER_ID}] Job ${msg_id} Failed:`, err);
        // Optional: Retry logic or delete if fatal
        // await queueService.delete(msg_id); // If we want to drop it
    }
}

async function startWorker() {
    let running = true;

    // Graceful Shutdown
    process.on('SIGINT', () => {
        console.log(`\n[${WORKER_ID}] Shutting down...`);
        running = false;
    });

    while (running) {
        try {
            // specific method we created in queue service that calls the RPC
            // Assuming queueService.validPop exists and calls 'pop_ai_job'
            const jobs = await queueService.validPop(1, 30);

            if (jobs && jobs.length > 0) {
                for (const job of jobs) {
                    await processJob(job);
                }
            } else {
                // No jobs, wait before polling again
                await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            }
        } catch (err) {
            console.error(`[${WORKER_ID}] Polling Error:`, err);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait longer on error
        }
    }
}

startWorker();
