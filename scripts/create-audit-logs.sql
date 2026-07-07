create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_actor_id on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_manager" on public.audit_logs;
create policy "audit_logs_select_manager"
on public.audit_logs
for select
to authenticated
using (
  (select role from public.profiles where id = auth.uid()) = 'manager'
);
