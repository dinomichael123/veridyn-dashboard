-- Sessions synced from local .claude/
create table sessions (
  id text primary key,
  title text not null,
  cwd text,
  is_running boolean default false,
  last_activity_at timestamptz,
  raw_json jsonb,
  updated_at timestamptz default now()
);

-- Tasks synced from local todos/*.json
create table tasks (
  id text primary key,
  session_id text,
  subject text not null,
  description text,
  status text default 'pending' check (status in ('pending','in_progress','completed','deleted')),
  updated_at timestamptz default now()
);

-- Memory files from .claude/projects/.../memory/
create table memory_files (
  id text primary key,
  type text check (type in ('user','feedback','project','reference')),
  name text not null,
  content text,
  file_path text,
  updated_at timestamptz default now()
);

-- Installed skills
create table skills (
  id text primary key,
  name text not null,
  description text,
  skill_md_content text,
  updated_at timestamptz default now()
);

-- Cloud scheduled tasks
create table scheduled_jobs (
  id text primary key,
  description text,
  cron_expression text,
  enabled boolean default true,
  next_run_at timestamptz,
  last_run_at timestamptz,
  updated_at timestamptz default now()
);

-- Jobs board (manual + Supabase)
create table jobs_board (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client text,
  value_usd numeric(12,2) default 0,
  deadline date,
  status text default 'backlog' check (status in ('backlog','in_progress','review','done')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Voice/chat history
create table chat_history (
  id uuid primary key default gen_random_uuid(),
  role text check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Commands sent from frontend to daemon
create table commands (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb,
  executed_at timestamptz,
  created_at timestamptz default now()
);

-- Daemon heartbeat
create table daemon_status (
  id int primary key default 1,
  last_heartbeat timestamptz,
  is_online boolean default false
);
insert into daemon_status (id, last_heartbeat, is_online) values (1, now(), false);

-- Revenue cache (populated by AI advisor + integrations)
-- source can be: youtube, hubspot, klaviyo, veridyn, affiliate, other (or any string)
create table revenue_cache (
  id text primary key,
  source text not null,
  amount_usd numeric(12,2) default 0,
  period text,
  metadata jsonb,
  updated_at timestamptz default now()
);
