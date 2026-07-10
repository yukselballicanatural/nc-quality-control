-- The "teams" table's rows were originally ad-hoc team names ("İstanbul
-- Ekibi", "Ankara Ekibi", "Online Ekibi"). They're being repurposed to
-- represent the two real regions (Istanbul / Morocco) shown in the admin
-- Settings page. Existing evaluations keep referencing the same ids, so
-- this is a pure rename — no evaluation data is affected.

update public.teams set name = 'Istanbul' where id = '11111111-1111-1111-1111-111111111111';
update public.teams set name = 'Morocco'  where id = '22222222-2222-2222-2222-222222222222';

-- "Online Ekibi" isn't referenced by any evaluation/profile — safe to remove.
delete from public.teams where id = '33333333-3333-3333-3333-333333333333';
