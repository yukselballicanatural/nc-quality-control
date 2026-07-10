-- SECURITY FIX: criteria_scores, channel_checks, and critical_errors
-- currently have "USING (true) WITH CHECK (true)" policies, meaning any
-- authenticated user (even a consultant) can read/write/delete any
-- evaluation's scores, channel checks, or critical errors directly via
-- the Supabase REST API, regardless of whether they have any
-- relationship to that evaluation (IDOR).
--
-- This replaces that with two policies per table, mirroring the
-- evaluations table's own existing authorization exactly:
--   - SELECT: same visibility as evaluations_select
--     (own evaluation as consultant, or quality_team/team_leader/manager)
--   - INSERT/UPDATE/DELETE: same as who can currently save an evaluation
--     (the assigned evaluator, or quality_team/manager)
--
-- Since the app always deletes+reinserts these child rows together with
-- an evaluations update (never edits an evaluation without also being
-- allowed to write its children), this exactly matches what already
-- works today — nothing that currently succeeds should start failing.

-- ── criteria_scores ─────────────────────────────────────────────
drop policy if exists "criteria_scores_all" on public.criteria_scores;

create policy "criteria_scores_select"
on public.criteria_scores
for select
to authenticated
using (
  exists (
    select 1 from public.evaluations e
    where e.id = criteria_scores.evaluation_id
    and (
      e.consultant_id = auth.uid()
      or (select role from public.profiles where id = auth.uid()) in ('quality_team', 'team_leader', 'manager')
    )
  )
);

create policy "criteria_scores_write"
on public.criteria_scores
for all
to authenticated
using (
  exists (
    select 1 from public.evaluations e
    where e.id = criteria_scores.evaluation_id
    and (
      e.evaluator_id = auth.uid()
      or (select role from public.profiles where id = auth.uid()) in ('quality_team', 'manager')
    )
  )
)
with check (
  exists (
    select 1 from public.evaluations e
    where e.id = criteria_scores.evaluation_id
    and (
      e.evaluator_id = auth.uid()
      or (select role from public.profiles where id = auth.uid()) in ('quality_team', 'manager')
    )
  )
);

-- ── channel_checks ──────────────────────────────────────────────
drop policy if exists "channel_checks_all" on public.channel_checks;

create policy "channel_checks_select"
on public.channel_checks
for select
to authenticated
using (
  exists (
    select 1 from public.evaluations e
    where e.id = channel_checks.evaluation_id
    and (
      e.consultant_id = auth.uid()
      or (select role from public.profiles where id = auth.uid()) in ('quality_team', 'team_leader', 'manager')
    )
  )
);

create policy "channel_checks_write"
on public.channel_checks
for all
to authenticated
using (
  exists (
    select 1 from public.evaluations e
    where e.id = channel_checks.evaluation_id
    and (
      e.evaluator_id = auth.uid()
      or (select role from public.profiles where id = auth.uid()) in ('quality_team', 'manager')
    )
  )
)
with check (
  exists (
    select 1 from public.evaluations e
    where e.id = channel_checks.evaluation_id
    and (
      e.evaluator_id = auth.uid()
      or (select role from public.profiles where id = auth.uid()) in ('quality_team', 'manager')
    )
  )
);

-- ── critical_errors ─────────────────────────────────────────────
drop policy if exists "critical_errors_all" on public.critical_errors;

create policy "critical_errors_select"
on public.critical_errors
for select
to authenticated
using (
  exists (
    select 1 from public.evaluations e
    where e.id = critical_errors.evaluation_id
    and (
      e.consultant_id = auth.uid()
      or (select role from public.profiles where id = auth.uid()) in ('quality_team', 'team_leader', 'manager')
    )
  )
);

create policy "critical_errors_write"
on public.critical_errors
for all
to authenticated
using (
  exists (
    select 1 from public.evaluations e
    where e.id = critical_errors.evaluation_id
    and (
      e.evaluator_id = auth.uid()
      or (select role from public.profiles where id = auth.uid()) in ('quality_team', 'manager')
    )
  )
)
with check (
  exists (
    select 1 from public.evaluations e
    where e.id = critical_errors.evaluation_id
    and (
      e.evaluator_id = auth.uid()
      or (select role from public.profiles where id = auth.uid()) in ('quality_team', 'manager')
    )
  )
);
