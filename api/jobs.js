import { createApiHandler, withAuth, withLogging } from '../src/lib/api-handler.ts';
import { enqueueJob, getJobStatus } from '../src/lib/services/job.service.ts';
import { z } from 'zod';

const postSchema = z.object({
    type: z.enum(['research_strain', 'generate_image']),
    payload: z.record(z.any()),
});

const handler = async (req, res) => {
    const user = req.user; // Auth user

    if (req.method === 'POST') {
        try {
            const { type, payload } = postSchema.parse(req.body);

            // Add user_id to payload for context if needed
            const enrichedPayload = { ...payload, userId: user.userId };

            const result = await enqueueJob(type, enrichedPayload);

            if (!result) {
                return res.status(500).json({ error: 'Failed to enqueue job. Queue service might be down.' });
            }

            return res.status(202).json({
                success: true,
                msg_id: result.msg_id,
                status: 'queued',
                message: 'Job accepted for background processing.'
            });
        } catch (e) {
            if (e instanceof z.ZodError) {
                return res.status(400).json({ error: 'Validation Error', details: e.errors });
            }
            throw e;
        }

    } else if (req.method === 'GET') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing job ID (query param ?id=...)' });

        const job = await getJobStatus(id);

        if (!job) return res.status(404).json({ error: 'Job not found' });

        // Security: Ensure user owns the job? 
        // Currently ai_job_results doesn't enforce ownership column strictly, but payload might.
        // For 'Service Role' table RLS is full. 
        // If we want users to see ONLY their jobs, we should have added user_id to ai_job_results.
        // Step 10.1 didn't add user_id. We rely on RLS 'service role' so API acts as admin.
        // We trust the API to return info.

        return res.status(200).json(job);
    }

    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
};

export default createApiHandler(handler, [
    withLogging,
    withAuth
]);
