-- Allows marking a recheck item as done ("Kontrol Edildi").
-- Run this in the Supabase SQL editor.

alter table public.evaluations
add column if not exists recheck_done boolean not null default false;

alter table public.evaluations
add column if not exists recheck_done_at timestamptz;

alter table public.evaluations
add column if not exists recheck_done_by uuid references public.profiles(id);

create index if not exists idx_evaluations_recheck_done
on public.evaluations (recheck_done, dev_recheck_date);
