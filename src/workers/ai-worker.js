import 'dotenv/config'; // Load env vars
import { createClient } from '@supabase/supabase-js';
import { researchStrain } from '../lib/gemini.js';

// Initialize Supabase client with the SERVICE_ROLE_KEY for backend operations
const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, // Fallback for docker
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY, // Needs service role
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Main worker loop
const runWorker = async () => {
    console.log('AI Worker: Starting polling loop (PGMQ)...');

    while (true) {
        try {
            // 1. Poll for a new job using the RPC wrapper
            const { data: job, error } = await supabase.rpc('pop_ai_job');

            if (error) {
                console.error('AI Worker: Error polling queue:', error);
                await new Promise(resolve => setTimeout(resolve, 5000));
                continue;
            }

            if (!job || job.length === 0) {
                // No jobs in queue, wait a bit
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }

            const jobData = job[0];
            const { msg_id, message } = jobData;
            console.log(`[Job ${msg_id}] Received:`, message.type);

            // Update status to 'processing'
            await supabase
                .from('ai_job_results')
                .update({ status: 'processing', updated_at: new Date() })
                .eq('msg_id', msg_id);

            let output = null;
            let status = 'completed';
            let errorMessage = null;

            try {
                // ===================================
                // ==> REAL PROCESSING LOGIC <==
                // ===================================
                if (message.type === 'research_strain') {
                    console.log(`Researching strain: ${message.payload.strainName}`);
                    // Support companyName for specific cuts
                    output = await researchStrain(message.payload.strainName, message.payload.companyName || "");
                } else if (message.type === 'generate_image') {
                    console.log("Image generation queued (Placeholder)");
                    // Call generateImage here when integrated
                    output = { url: "https://via.placeholder.com/512?text=Cannabis+Render" };
                } else {
                    console.warn(`Unknown job type: ${message.type}`);
                    status = 'failed';
                    errorMessage = 'Unknown job type';
                }
            } catch (jobError) {
                console.error(`Job ${msg_id} Execution Failed:`, jobError);
                status = 'failed';
                errorMessage = jobError.message || String(jobError);
            }

            // Update result
            const { error: updateError } = await supabase
                .from('ai_job_results')
                .update({
                    status,
                    result: output,
                    error_message: errorMessage,
                    updated_at: new Date()
                })
                .eq('msg_id', msg_id);

            if (updateError) console.error("Failed to update result:", updateError);

            // Archive (ACK)
            const { error: archiveError } = await supabase.rpc('archive_ai_job', { p_msg_id: msg_id });
            if (archiveError) console.error('Archive Error:', archiveError);
            else console.log(`[Job ${msg_id}] Processed and Archived.`);

        } catch (e) {
            console.error('AI Worker: Global Loop Error:', e);
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
};

runWorker();
