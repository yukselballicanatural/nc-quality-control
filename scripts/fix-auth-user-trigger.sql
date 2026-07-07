-- Fixes "Database error creating new user" in Supabase Auth.
-- Run this in the Supabase SQL editor, then create the requested users again.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  safe_role public.user_role;
begin
  requested_role := new.raw_user_meta_data->>'role';

  safe_role :=
    case
      when requested_role in ('quality_team', 'team_leader', 'manager', 'consultant')
        then requested_role::public.user_role
      else 'consultant'::public.user_role
    end;

  insert into public.profiles (
    id,
    full_name,
    email,
    role,
    team_id,
    team_leader_id,
    is_active
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    safe_role,
    null,
    null,
    true
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
