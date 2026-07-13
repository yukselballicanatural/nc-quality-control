alter table public.training_exams
add column if not exists training_type text
check (training_type in ('pre', 'post'));
