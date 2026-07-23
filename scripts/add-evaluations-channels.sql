-- Store the FULL set of channels chosen for an evaluation (e.g. both WhatsApp
-- and Call), not just the primary one. The single `channel` column is kept for
-- backward compatibility and continues to hold the primary channel.

alter table public.evaluations
  add column if not exists channels text[];

-- Backfill existing rows: combine the primary channel with any channels that
-- were recorded in channel_checks, so older dual-channel evaluations recover
-- both channels where that data still exists.
update public.evaluations e
set channels = array(
  select distinct c
  from (
    select e.channel::text as c
    union
    select cc.channel::text
    from public.channel_checks cc
    where cc.evaluation_id = e.id
  ) s
  where c is not null
)
where channels is null;
