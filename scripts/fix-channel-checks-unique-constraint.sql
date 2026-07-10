-- The live channel_checks table has a unique constraint on
-- (evaluation_id, question_number) only, which blocks saving the same
-- question_number for two different channels (e.g. WhatsApp + Call
-- selected together). Widen it to include channel.

alter table public.channel_checks
drop constraint if exists channel_checks_evaluation_id_question_number_key;

alter table public.channel_checks
add constraint channel_checks_evaluation_id_channel_question_number_key
unique (evaluation_id, channel, question_number);
