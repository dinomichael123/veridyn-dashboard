-- RLS policies for the dashboard frontend (anon key). Idempotent — safe to re-run.
-- Server API routes and the local daemon use the service role key and bypass RLS.
--
-- NOTE: these policies are deliberately permissive (`using (true)`). This is a
-- single-user dashboard gated by Vercel SSO deployment protection, so RLS here
-- exists to satisfy Supabase's RLS requirement, not to enforce per-user access
-- control. If the dashboard ever gets real auth, replace these with
-- auth.uid()-scoped policies.
--
-- To grant access to a new table, add it to the arrays below and re-run.

do $$
declare
  t text;
  -- every dashboard table; 'commands' is daemon/service-role only (no anon access)
  all_tables constant text[] := array[
    'sessions','tasks','memory_files','skills','scheduled_jobs',
    'jobs_board','chat_history','commands','daemon_status','revenue_cache'];
  anon_read constant text[] := array[
    'sessions','tasks','memory_files','skills','scheduled_jobs',
    'jobs_board','chat_history','daemon_status','revenue_cache'];
  -- tables the UI writes client-side (JobsBoardPanel, RevenueSourcesPanel)
  anon_write constant text[] := array['jobs_board','revenue_cache'];
  -- tables with a frontend Realtime subscriber (useRealtimeTable/useDaemonStatus).
  -- chat_history is excluded: it is server-written and never subscribed to,
  -- so publishing it would put every chat insert on the replication stream
  -- for no consumer.
  realtime constant text[] := array[
    'sessions','tasks','memory_files','skills','scheduled_jobs',
    'jobs_board','daemon_status','revenue_cache'];
begin
  foreach t in array all_tables loop
    execute format('alter table %I enable row level security', t);
  end loop;

  foreach t in array anon_read loop
    execute format('drop policy if exists "anon read" on %I', t);
    execute format('create policy "anon read" on %I for select to anon using (true)', t);
  end loop;

  foreach t in array anon_write loop
    execute format('drop policy if exists "anon insert" on %I', t);
    execute format('create policy "anon insert" on %I for insert to anon with check (true)', t);
    execute format('drop policy if exists "anon update" on %I', t);
    execute format('create policy "anon update" on %I for update to anon using (true) with check (true)', t);
  end loop;

  foreach t in array realtime loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then
      null; -- already in the publication
    end;
  end loop;

  -- Cleanup in case an earlier version of this migration published chat_history
  begin
    alter publication supabase_realtime drop table chat_history;
  exception when others then
    null; -- was never in the publication
  end;
end $$;
