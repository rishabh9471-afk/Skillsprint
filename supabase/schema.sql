-- SkillSprint AI Coach — database setup for Supabase (free plan).
-- Run this once: Supabase dashboard → SQL Editor → New query → paste → Run.

create table if not exists visitors (
  id uuid primary key,
  nickname text not null,
  tag text not null,
  recovery_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key,
  visitor_id uuid not null,
  scenario_id text not null,
  day date,                      -- IST day the session started (daily limit)
  started_at timestamptz not null default now(),
  first_score numeric,
  latest_score numeric,
  revisions int not null default 0,
  answer_text text,              -- latest answer, for reviewing grading quality
  provider text,                 -- gemini | groq
  prompt_version text,
  followup_score numeric,
  final_score numeric,
  verdict text,                  -- strong | borderline | needs_work
  xp int not null default 0,
  practice boolean not null default false,
  completed_at timestamptz,
  verdict_payload jsonb
);
create index if not exists sessions_visitor_day on sessions (visitor_id, day);
create index if not exists sessions_completed on sessions (completed_at) where xp > 0;
create index if not exists sessions_started on sessions (started_at);

create table if not exists events (
  id bigint generated always as identity primary key,
  visitor_id uuid,
  session_id uuid,
  scenario_id text,
  name text not null,
  props jsonb not null default '{}'::jsonb,
  ts timestamptz not null default now(),
  source text not null default 'client'   -- client | server
);
create index if not exists events_ts on events (ts);
create index if not exists events_name_ts on events (name, ts);

create table if not exists usage (
  day date primary key,
  requests int not null default 0
);

-- Atomically add n AI requests to today's counter and return the new total.
create or replace function bump_usage(p_day date, p_n int)
returns int
language sql
as $$
  insert into usage (day, requests) values (p_day, p_n)
  on conflict (day) do update set requests = usage.requests + excluded.requests
  returning requests;
$$;

-- Lock the tables: only the server (service role key) can read or write.
alter table visitors enable row level security;
alter table sessions enable row level security;
alter table events enable row level security;
alter table usage enable row level security;
revoke execute on function bump_usage(date, int) from public, anon, authenticated;
grant execute on function bump_usage(date, int) to service_role;
