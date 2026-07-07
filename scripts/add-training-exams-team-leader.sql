alter table public.training_exams
add column if not exists team_leader_id uuid references public.profiles(id);

create index if not exists idx_training_exams_team_leader_id
on public.training_exams(team_leader_id);
