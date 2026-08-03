alter table public.training_exams
add column if not exists note text;

alter table public.training_exams
drop constraint if exists training_exams_note_length_check;

alter table public.training_exams
add constraint training_exams_note_length_check
check (note is null or char_length(note) <= 150);
