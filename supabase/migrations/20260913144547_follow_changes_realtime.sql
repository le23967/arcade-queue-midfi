-- Live follow state.
--
-- A follow made in one browser has to show up in the other without a reload:
-- B following A should turn A's "Following" into "Mutual" while both are
-- open. This adds the one thing needed for that.
--
-- Why not simply broadcast the follows table? Realtime applies row level
-- security to INSERT and UPDATE change events, but it cannot apply it to
-- DELETE - the row is gone, so there is nothing to evaluate a policy against
-- - and an unfollow would be delivered, as a (follower, following) pair, to
-- any signed-in client that subscribed to the table. The follows policies
-- say you only see edges that touch you, and that has to hold for what
-- arrives over a socket as much as for what a query returns.
--
-- So follows stays off the publication. Instead a trigger writes a small
-- notice for each of the two people involved whenever an edge is created or
-- removed, into a table whose only policy is "your own notices". Only
-- inserts are broadcast, which is the case RLS covers, and a client that
-- receives one simply refetches its own follow graph. The notice carries
-- who the other person was and whether it was a follow or an unfollow, but
-- nothing the client could not already read.
--
-- Applies on top of 20260913140043_accounts_and_messaging.sql, which is
-- already live; this file does not touch anything that migration created.
-- Safe to run more than once.

create table if not exists public.follow_changes (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  other_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('follow', 'unfollow')),
  created_at timestamptz not null default now()
);

create index if not exists follow_changes_user_created_idx
  on public.follow_changes (user_id, created_at);

-- Written by the trigger below, which runs as the function owner, so no
-- client ever inserts here directly. Old notices are pruned as new ones are
-- written; nothing reads them after they have been delivered.
create or replace function public.notify_follow_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  edge public.follows;
  change text;
begin
  if tg_op = 'INSERT' then
    edge := new;
    change := 'follow';
  else
    edge := old;
    change := 'unfollow';
  end if;

  insert into public.follow_changes (user_id, other_id, kind)
  values
    (edge.follower_id, edge.following_id, change),
    (edge.following_id, edge.follower_id, change);

  delete from public.follow_changes
  where created_at < now() - interval '1 day';

  return null;
end;
$$;

revoke all on function public.notify_follow_change() from public;

drop trigger if exists follows_notify_change on public.follows;
create trigger follows_notify_change
  after insert or delete on public.follows
  for each row execute function public.notify_follow_change();

-- Privileges: read your own, write nothing.
revoke all on public.follow_changes from anon;
revoke all on public.follow_changes from authenticated;
grant select on public.follow_changes to authenticated;

alter table public.follow_changes enable row level security;

drop policy if exists follow_changes_select_own on public.follow_changes;
create policy follow_changes_select_own on public.follow_changes
  for select to authenticated
  using (user_id = auth.uid());

-- Realtime. Only inserts are consumed, so the default replica identity (the
-- primary key) is all that is needed; there is no update or delete payload
-- to make complete. messages stays on the publication as before.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'follow_changes'
  ) then
    alter publication supabase_realtime add table public.follow_changes;
  end if;
end;
$$;
