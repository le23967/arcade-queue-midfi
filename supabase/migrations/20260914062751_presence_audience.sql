-- Who can see where you are: a choice of your own.
--
-- Presence has always been shared between people who follow each other,
-- and that stays the default. But it made the map useless for exactly the
-- moment it was built for - you have just met someone, followed them, and
-- cannot see them until they get round to following you back. So each
-- person now chooses their own audience: the people they follow back, or
-- anyone who follows them. The choice belongs to the person being seen,
-- which is what keeps the research finding intact: nobody is located
-- without having agreed to it.
--
-- The choice lives on the profile, because a profile exists from sign-up
-- and a presence row only from the first check-in. Applies on top of the
-- four migrations already live. Safe to run more than once.

alter table public.profiles
  add column if not exists presence_audience text not null default 'mutuals';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_presence_audience_check'
  ) then
    alter table public.profiles
      add constraint profiles_presence_audience_check
      check (presence_audience in ('mutuals', 'followers'));
  end if;
end;
$$;

-- Does the caller get to see p_subject's presence? Always their own; a
-- mutual's always; a follower's only if that person has said followers
-- may. Security definer so the follows and profile rows it needs are read
-- as the function owner, not through the caller's own policies.
create or replace function public.can_see_presence(p_subject uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and (
    p_subject = auth.uid()
    or public.is_mutual(auth.uid(), p_subject)
    or (
      exists (
        select 1 from public.follows
        where follower_id = auth.uid() and following_id = p_subject
      )
      and exists (
        select 1 from public.profiles
        where id = p_subject and presence_audience = 'followers'
      )
    )
  );
$$;

revoke all on function public.can_see_presence(uuid) from public;
grant execute on function public.can_see_presence(uuid) to authenticated;

drop policy if exists presence_select on public.presence;
create policy presence_select on public.presence
  for select to authenticated
  using (
    user_id = auth.uid()
    or (active and visible and public.can_see_presence(user_id))
  );

-- Notices go to everyone who may see the row: mutuals, plus followers when
-- the person has opened it to them. A change of audience on the profile
-- is written as a notice as well, so someone newly allowed to look sees
-- the check-in without a reload.
create or replace function public.presence_audience_of(p_subject uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select f1.following_id
  from public.follows f1
  join public.follows f2
    on f2.follower_id = f1.following_id and f2.following_id = f1.follower_id
  where f1.follower_id = p_subject
  union
  select f.follower_id
  from public.follows f
  where f.following_id = p_subject
    and exists (
      select 1 from public.profiles p
      where p.id = p_subject and p.presence_audience = 'followers'
    )
  union
  select p_subject;
$$;

revoke all on function public.presence_audience_of(uuid) from public;

create or replace function public.notify_presence_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  subject uuid;
begin
  if tg_op = 'DELETE' then
    subject := old.user_id;
  else
    subject := new.user_id;
  end if;
  if not exists (select 1 from public.profiles where id = subject) then
    return null;
  end if;

  insert into public.presence_changes (user_id, about_id)
  select a, subject
  from public.presence_audience_of(subject) as a
  where exists (select 1 from public.profiles where id = a);

  delete from public.presence_changes
  where created_at < now() - interval '1 day';

  return null;
end;
$$;

revoke all on function public.notify_presence_change() from public;

-- The same notice when the audience itself changes, if there is a check-in
-- to see.
create or replace function public.notify_presence_audience_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.presence_audience is distinct from old.presence_audience
     and exists (select 1 from public.presence where user_id = new.id and active) then
    insert into public.presence_changes (user_id, about_id)
    select a, new.id
    from public.presence_audience_of(new.id) as a
    union
    select f.follower_id, new.id
    from public.follows f
    where f.following_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function public.notify_presence_audience_change() from public;

drop trigger if exists profiles_notify_presence_audience on public.profiles;
create trigger profiles_notify_presence_audience
  after update of presence_audience on public.profiles
  for each row execute function public.notify_presence_audience_change();
