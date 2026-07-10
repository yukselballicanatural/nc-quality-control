-- critical_errors also never received real inserts before today (the
-- step that writes to it was disconnected, same as channel_checks was),
-- so if its RLS policy is missing/stale in the live DB, this closes that
-- gap the same way. Safe to run even if the policy already exists.

alter table public.critical_errors enable row level security;

drop policy if exists "critical_errors_all" on public.critical_errors;
create policy "critical_errors_all"
on public.critical_errors
for all
to authenticated
using (true)
with check (true);

alter table public.criteria_scores enable row level security;

drop policy if exists "criteria_scores_all" on public.criteria_scores;
create policy "criteria_scores_all"
on public.criteria_scores
for all
to authenticated
using (true)
with check (true);
