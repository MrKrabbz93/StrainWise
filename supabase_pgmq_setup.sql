-- Enable the PGMQ extension
create extension if not exists pgmq;

-- Create the queue for AI jobs
select pgmq.create('ai_job_queue');

-- Verify creation
select * from pgmq.list_queues();

-- Note: The worker will allow:
-- 1. pushing jobs via: select pgmq.send('ai_job_queue', '{"type": "generate", "prompt": "..."}');
-- 2. popping jobs via: select * from pgmq.pop('ai_job_queue');
