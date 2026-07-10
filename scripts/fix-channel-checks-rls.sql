-- channel_checks never had a real INSERT before (the step that writes to
-- it was disconnected from the form), so its RLS policy gap went
-- unnoticed. Allow authenticated users full access, matching
-- criteria_scores/critical_errors (evaluations RLS already scopes access
-- at the parent-record level).

alter table public.channel_checks enable row level security;

drop policy if exists "channel_checks_all" on public.channel_checks;
create policy "channel_checks_all"
on public.channel_checks
for all
to authenticated
using (true)
with check (true);
