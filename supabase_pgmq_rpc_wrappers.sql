-- ===================================================================
-- RPC Wrappers for the AI Job Queue (pgmq)
-- ===================================================================

-- Wrapper to safely pop a job from the ai_job_queue
-- It returns the job details or null if the queue is empty.
create or replace function pop_ai_job()
returns table (
  msg_id bigint,
  read_ct integer,
  enqueued_at timestamptz,
  vt timestamptz,
  message jsonb
)
language sql
security definer
as $$
  select *
  from pgmq.pop('ai_job_queue');
$$;

-- Wrapper to archive a job after it has been successfully processed
-- It takes the msg_id of the job to archive.
create or replace function archive_ai_job(p_msg_id bigint)
returns boolean
language plpgsql
security definer
as $$
begin
  perform pgmq.archive('ai_job_queue', p_msg_id);
  return true;
exception
  when others then
    return false;
end;
$$;

-- Wrapper to delete a job if it fails and cannot be processed
create or replace function delete_ai_job(p_msg_id bigint)
returns boolean
language plpgsql
security definer
as $$
begin
  perform pgmq.delete('ai_job_queue', p_msg_id);
  return true;
exception
  when others then
    return false;
end;
$$;

-- Grant execute permissions to the service role that your backend will use.
-- This is more secure than granting to 'anon' or 'authenticated'.
-- Replace 'service_role' with the actual role if it's different.
-- Note: 'service_role' is the standard high-privilege role in Supabase.
grant execute on function pop_ai_job() to service_role;
grant execute on function archive_ai_job(bigint) to service_role;
grant execute on function delete_ai_job(bigint) to service_role;
