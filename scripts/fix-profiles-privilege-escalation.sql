-- SECURITY FIX: the profiles_update policy only checked that a user was
-- updating their own row (id = auth.uid()), with no restriction on which
-- columns they could change. Any authenticated user could call the
-- Supabase REST API directly (bypassing the app entirely) and set their
-- own role to 'manager', flip is_active, or move themselves into a
-- different team — a full privilege-escalation path.
--
-- No feature in the app updates profiles from the client (all admin
-- actions go through /api/users with the service-role key, which
-- bypasses RLS anyway), so tightening this is purely a fix and changes
-- no legitimate behavior.
--
-- The new policy still lets a user update their own row, but only if
-- role, is_active, and team_id stay exactly what they already were.

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = (select p.role from public.profiles p where p.id = auth.uid())
  and is_active = (select p.is_active from public.profiles p where p.id = auth.uid())
  and team_id is not distinct from (select p.team_id from public.profiles p where p.id = auth.uid())
);

-- Same idea for insert: force new self-created rows to the safe default
-- role, matching what the handle_new_user() trigger already does, in
-- case a client ever inserts before the trigger does.
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() and role = 'consultant' and is_active = true);
