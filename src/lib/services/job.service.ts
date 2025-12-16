import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client with Service Role Key (Backend Only)
// This service is intended for Serverless Functions or Docker Backend
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.warn("JobService: Missing Supabase URL or Service Role Key. Job enqueuing will fail.");
}

const supabase = createClient(supabaseUrl || '', serviceRoleKey || '');

type JobType = 'research_strain' | 'generate_image';

/**
 * Enqueues a new AI job to be processed by the background worker.
 * @param jobType - The type of AI job.
 * @param payload - The data for the job.
 * @returns The message ID of the enqueued job.
 */
export async function enqueueJob(jobType: JobType, payload: object): Promise<{ msg_id: number } | null> {
    try {
        // Note: Requires a public wrapper function `pgmq_send` in the database
        // wrapping `pgmq.send(queue_name, message)`.
        const { data, error } = await supabase.rpc('pgmq_send', {
            queue_name: 'ai_job_queue',
            message: { type: jobType, payload },
        });

        if (error) {
            console.error('Error enqueuing job:', error);
            return null;
        }

        // Also create a record in our results table for tracking
        // We try/catch this separately to not block the flow if tracking fails, 
        // though ideally it should be consistent.
        try {
            await supabase.from('ai_job_results').insert({
                msg_id: data, // pgmq_send wrapper usually returns the ID directly or object
                job_type: jobType,
                payload,
                status: 'queued',
            });
        } catch (insertError) {
            console.error("Failed to track job in ai_job_results:", insertError);
        }

        return { msg_id: data };
    } catch (err) {
        console.error('Unexpected error in enqueueJob:', err);
        return null;
    }
}

/**
 * Retrieves the status and result of a job.
 * @param msg_id - The message ID of the job.
 */
export async function getJobStatus(msg_id: number) {
    const { data, error } = await supabase
        .from('ai_job_results')
        .select('*')
        .eq('msg_id', msg_id)
        .single();

    if (error) return null;
    return data;
}
