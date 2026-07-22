-- Restrict quality_team users to their OWN records at the database level (RLS),
-- matching the app-level isolation. Managers keep full visibility; team leaders
-- and consultants are unchanged. Only the two "see everything" SELECT policies
-- are replaced — no insert/update/delete (write) policy is touched.
--
-- "Who performed it" is already stored on each row via evaluator_id, so the
-- isolation keys off evaluator_id = auth.uid().

-- ── EVALUATIONS ──────────────────────────────────────────────────────
-- Was: eval_select_all → quality_team OR manager could read every row.
drop policy if exists "eval_select_all" on public.evaluations;

drop policy if exists "eval_select_manager" on public.evaluations;
create policy "eval_select_manager" on public.evaluations
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'manager'
  )
);

drop policy if exists "eval_select_quality_own" on public.evaluations;
create policy "eval_select_quality_own" on public.evaluations
for select
using (
  evaluator_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'quality_team'
  )
);

-- ── TRAINING EXAMS ───────────────────────────────────────────────────
-- Was: "quality team and manager select all" → quality_team OR manager read all.
drop policy if exists "quality team and manager select all" on public.training_exams;

drop policy if exists "exams_select_manager" on public.training_exams;
create policy "exams_select_manager" on public.training_exams
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'manager'
  )
);

drop policy if exists "exams_select_quality_own" on public.training_exams;
create policy "exams_select_quality_own" on public.training_exams
for select
using (
  evaluator_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'quality_team'
  )
);
