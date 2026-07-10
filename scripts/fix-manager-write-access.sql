-- The original evaluations_insert/update RLS policies only allow
-- quality_team/team_leader, so managers get blocked from saving
-- evaluations and training exams even though the app's access-control
-- logic allows them. These new policies are additive (permissive
-- policies combine with OR) and don't touch the existing ones.

drop policy if exists "evaluations_insert_manager" on public.evaluations;
create policy "evaluations_insert_manager"
on public.evaluations
for insert
to authenticated
with check (
  (select role from public.profiles where id = auth.uid()) = 'manager'
);

drop policy if exists "evaluations_update_manager" on public.evaluations;
create policy "evaluations_update_manager"
on public.evaluations
for update
to authenticated
using (
  (select role from public.profiles where id = auth.uid()) = 'manager'
);

drop policy if exists "training_exams_insert_manager" on public.training_exams;
create policy "training_exams_insert_manager"
on public.training_exams
for insert
to authenticated
with check (
  (select role from public.profiles where id = auth.uid()) = 'manager'
);

drop policy if exists "training_exams_update_manager" on public.training_exams;
create policy "training_exams_update_manager"
on public.training_exams
for update
to authenticated
using (
  (select role from public.profiles where id = auth.uid()) = 'manager'
);
