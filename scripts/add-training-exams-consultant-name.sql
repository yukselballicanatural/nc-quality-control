-- Allows training exams to store manually typed consultant names.
-- Run this in the Supabase SQL editor.

alter table public.training_exams
add column if not exists consultant_name text;

alter table public.training_exams
alter column consultant_id drop not null;

create index if not exists idx_training_exams_consultant_name
on public.training_exams (consultant_name);
