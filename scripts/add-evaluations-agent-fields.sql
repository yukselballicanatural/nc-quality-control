-- Allows evaluations to store consultant info pulled from the CRM-synced `agents`
-- table (HubSpot ids, not profiles.id), plus the derived region/team leader.
-- Run this in the Supabase SQL editor.

alter table public.evaluations
add column if not exists consultant_name text;

alter table public.evaluations
add column if not exists region text;

alter table public.evaluations
add column if not exists team_leader_name text;

alter table public.evaluations
add column if not exists agent_id text;

alter table public.evaluations
alter column consultant_id drop not null;

create index if not exists idx_evaluations_consultant_name
on public.evaluations (consultant_name);

create index if not exists idx_evaluations_agent_id
on public.evaluations (agent_id);
