import { supabase } from '../supabase.js';

export class QueueService {
    constructor(queueName = 'ai_job_queue') {
        this.queueName = queueName;
    }

    /**
     * Send a job to the queue
     * @param {Object} payload - The job data (e.g., { type: 'chat', prompt: '...' })
     */
    async sendJob(payload) {
        const { data, error } = await supabase.rpc('pgmq_send', {
            queue_name: this.queueName,
            message: payload,
        });

        if (error) {
            console.error('Failed to send job:', error);
            throw error;
        }
        return data;
    }

    /**
     * Poll for a batch of jobs
     * @param {number} batchSize 
     * @param {number} visibilityTimeoutSeconds - How long the job is hidden from others while processing
     */
    async validPop(batchSize = 1, visibilityTimeoutSeconds = 30) {
        // Note: Supabase JS client RPC wrapper for PG functions
        // Ideally we use a direct PG connection for workers (e.g. via Prisma or pg), 
        // but this works via the standard API layer if permissions allow.

        // PGMQ's pop function is: pgmq.pop(queue_name, visibility_timeout, max_messages)
        // We might need to call it via raw SQL if RPC wrapper isn't auto-generated or easy.

        // Using RPC 'pgmq_pop' if we wrap it, or just raw query if using Prisma/pg.
        // For simplicity in this mock, we assume an RPC wrapper or raw SQL execution.

        // Let's assume we use a direct PG query via supabase.rpc for safety or a custom function.
        // Actually, 'pgmq' functions are available to the postgres user. 
        // We need to Expose them via RPC or use a Service Role client that calls a custom SQL function.

        const { data, error } = await supabase.rpc('pop_ai_job', {
            q_name: this.queueName,
            sleep_seconds: visibilityTimeoutSeconds,
            limit_count: batchSize
        });

        if (error) return [];
        return data; // Array of jobs
    }

    /**
     * Archive/Delete a completed job
     */
    async archive(msgId) {
        return await supabase.rpc('archive_ai_job', {
            q_name: this.queueName,
            msg_id: msgId
        });
    }
}

export const queueService = new QueueService();
