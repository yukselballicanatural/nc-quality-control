-- Performance indexes for Natural Clinic QC.
-- Safe to run multiple times.

create index if not exists idx_evaluations_evaluator_created
on public.evaluations (evaluator_id, created_at desc);

create index if not exists idx_evaluations_team_created
on public.evaluations (team_id, created_at desc);

create index if not exists idx_evaluations_consultant_date
on public.evaluations (consultant_id, conversation_date desc);

create index if not exists idx_evaluations_status_date
on public.evaluations (status, conversation_date desc);

create index if not exists idx_evaluations_channel_date
on public.evaluations (channel, conversation_date desc);

create index if not exists idx_evaluations_recheck
on public.evaluations (dev_recheck_date, evaluator_id, team_id)
where dev_recheck_date is not null;

create index if not exists idx_channel_checks_eval_channel
on public.channel_checks (evaluation_id, channel);

create index if not exists idx_training_exams_evaluator_created
on public.training_exams (evaluator_id, created_at desc);

create index if not exists idx_training_exams_consultant_created
on public.training_exams (consultant_id, created_at desc);

create index if not exists idx_training_exams_level_created
on public.training_exams (level, created_at desc);

create index if not exists idx_profiles_role_active
on public.profiles (role, is_active);

create index if not exists idx_profiles_team_role
on public.profiles (team_id, role);
