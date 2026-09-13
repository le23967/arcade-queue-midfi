-- Sessions and presence, shared between accounts.
--
-- Until now a planned session and a check-in lived only on the phone that
-- made them. Inviting someone put a card on the host's own Later tab and
-- nothing on theirs; joining a queue moved the host's own map and nobody
-- else's; "Notify them" notified nobody. Each of those is a promise the
-- screen made that nothing behind it kept. This migration is what keeps
-- them.
--
--   sessions         a plan: host, venue, game, time, note, and whether it
--                    is open to anyone on the app.
--   session_members  who was asked, and who has said they are in. The host
--                    adds people as invited; a person adds themselves as
--                    going, to an open session or one they were asked to.
--   presence         one row per account: where they are checked in, since
--                    when, and whether they want to be seen. Shared only
--                    with people they follow both ways, and only while
--                    visible and active.
--   presence_changes notices to each mutual when someone's presence
--                    changes, for the same reason follow_changes exists:
--                    realtime cannot deliver an update the receiver is no
--                    longer allowed to see (a check-out, going hidden), so
--                    the receiver is told to look again instead.
--
-- Everything is behind row level security. A closed session is visible to
-- its host and members and nobody else; an open one to anyone signed in;
-- neither to someone on either side of a block with the host. Presence is
-- mutual-only, as it always was in the prototype.
--
-- Applies on top of the three migrations already live. Safe to run more
-- than once.

-- ---------------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------------

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  venue_id text not null check (char_length(venue_id) between 1 and 40),
  game_id text not null check (char_length(game_id) between 1 and 40),
  starts_at timestamptz not null,
  note text not null default '' check (char_length(note) <= 200),
  open boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sessions_starts_idx on public.sessions (starts_at);
create index if not exists sessions_host_idx on public.sessions (host_id);

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

create table if not exists public.session_members (
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- invited: asked by the host, not answered. going: said they are in.
  status text not null check (status in ('invited', 'going')),
  -- Whether the host asked them, as opposed to joining an open session on
  -- their own. Decides what "not going after all" leaves behind.
  by_host boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create index if not exists session_members_user_idx on public.session_members (user_id);

drop trigger if exists session_members_set_updated_at on public.session_members;
create trigger session_members_set_updated_at
  before update on public.session_members
  for each row execute function public.set_updated_at();

-- Who may see a session: its host, anyone asked or going, and - if it is
-- open - anyone signed in. Never anyone on either side of a block with the
-- host.
create or replace function public.can_view_session(p_session uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sessions s
    where s.id = p_session
      and auth.uid() is not null
      and not public.is_blocked_between(s.host_id, auth.uid())
      and (
        s.host_id = auth.uid()
        or s.open
        or exists (
          select 1 from public.session_members m
          where m.session_id = s.id and m.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.is_session_host(p_session uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sessions s where s.id = p_session and s.host_id = auth.uid()
  );
$$;

revoke all on function public.can_view_session(uuid) from public;
revoke all on function public.is_session_host(uuid) from public;
grant execute on function public.can_view_session(uuid) to authenticated;
grant execute on function public.is_session_host(uuid) to authenticated;

revoke all on public.sessions, public.session_members from anon;
revoke all on public.sessions from authenticated;
grant select, insert, update, delete on public.sessions to authenticated;
revoke all on public.session_members from authenticated;
grant select, insert, update, delete on public.session_members to authenticated;

alter table public.sessions enable row level security;
alter table public.session_members enable row level security;

-- The host's own rows are checked on the column, not through the
-- function: a row being inserted is not yet visible to a query inside the
-- same statement, and an insert that returns the new row is checked
-- against this policy.
drop policy if exists sessions_select_visible on public.sessions;
create policy sessions_select_visible on public.sessions
  for select to authenticated
  using (host_id = auth.uid() or public.can_view_session(id));

drop policy if exists sessions_insert_host on public.sessions;
create policy sessions_insert_host on public.sessions
  for insert to authenticated
  with check (host_id = auth.uid());

drop policy if exists sessions_update_host on public.sessions;
create policy sessions_update_host on public.sessions
  for update to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

drop policy if exists sessions_delete_host on public.sessions;
create policy sessions_delete_host on public.sessions
  for delete to authenticated
  using (host_id = auth.uid());

-- members: visible with the session. The host may add people as invited;
-- a person may add themselves as going to a session they can see. Each
-- side may change or remove its own rows: the host any member, a person
-- their own answer.
drop policy if exists session_members_select_visible on public.session_members;
create policy session_members_select_visible on public.session_members
  for select to authenticated
  using (user_id = auth.uid() or public.can_view_session(session_id));

drop policy if exists session_members_insert on public.session_members;
create policy session_members_insert on public.session_members
  for insert to authenticated
  with check (
    (status = 'invited' and by_host and user_id <> auth.uid() and public.is_session_host(session_id))
    or (status = 'going' and not by_host and user_id = auth.uid() and public.can_view_session(session_id))
  );

drop policy if exists session_members_update on public.session_members;
create policy session_members_update on public.session_members
  for update to authenticated
  using (user_id = auth.uid() or public.is_session_host(session_id))
  with check (user_id = auth.uid() or public.is_session_host(session_id));

drop policy if exists session_members_delete on public.session_members;
create policy session_members_delete on public.session_members
  for delete to authenticated
  using (user_id = auth.uid() or public.is_session_host(session_id));

-- A member row belongs to one session and one person for good. Without
-- this, a person could move their own row onto a closed session they were
-- never asked to and become able to see it.
create or replace function public.lock_session_member_keys()
returns trigger
language plpgsql
as $$
begin
  if new.session_id <> old.session_id or new.user_id <> old.user_id then
    raise exception 'a membership cannot be moved' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.lock_session_member_keys() from public;

drop trigger if exists session_members_lock_keys on public.session_members;
create trigger session_members_lock_keys
  before update on public.session_members
  for each row execute function public.lock_session_member_keys();

-- ---------------------------------------------------------------------------
-- presence
-- ---------------------------------------------------------------------------

create table if not exists public.presence (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  venue_id text not null check (char_length(venue_id) between 1 and 40),
  game_id text not null check (char_length(game_id) between 1 and 40),
  position integer check (position is null or position >= 1),
  -- False once they have checked out or left the queue. The row stays, so
  -- the next check-in is an update and mutuals hear about it the same way.
  active boolean not null default true,
  -- The person's own switch: hidden means no mutual sees this row at all.
  visible boolean not null default true,
  checked_in_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists presence_set_updated_at on public.presence;
create trigger presence_set_updated_at
  before update on public.presence
  for each row execute function public.set_updated_at();

revoke all on public.presence from anon;
revoke all on public.presence from authenticated;
grant select, insert, update, delete on public.presence to authenticated;

alter table public.presence enable row level security;

-- Yours always; someone else's only while it is active and visible and you
-- follow each other.
drop policy if exists presence_select on public.presence;
create policy presence_select on public.presence
  for select to authenticated
  using (
    user_id = auth.uid()
    or (active and visible and public.is_mutual(auth.uid(), user_id))
  );

drop policy if exists presence_insert_own on public.presence;
create policy presence_insert_own on public.presence
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists presence_update_own on public.presence;
create policy presence_update_own on public.presence
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists presence_delete_own on public.presence;
create policy presence_delete_own on public.presence
  for delete to authenticated
  using (user_id = auth.uid());

-- Notices. One row per mutual (and one for the person themselves, for
-- their other tabs) whenever a presence row changes. Written by the trigger
-- as its owner; clients only ever read their own.
create table if not exists public.presence_changes (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  about_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists presence_changes_user_created_idx
  on public.presence_changes (user_id, created_at);

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
  select f1.following_id, subject
  from public.follows f1
  join public.follows f2
    on f2.follower_id = f1.following_id and f2.following_id = f1.follower_id
  where f1.follower_id = subject
    and exists (select 1 from public.profiles where id = f1.following_id)
  union
  select subject, subject;

  delete from public.presence_changes
  where created_at < now() - interval '1 day';

  return null;
end;
$$;

revoke all on function public.notify_presence_change() from public;

drop trigger if exists presence_notify_change on public.presence;
create trigger presence_notify_change
  after insert or update or delete on public.presence
  for each row execute function public.notify_presence_change();

revoke all on public.presence_changes from anon;
revoke all on public.presence_changes from authenticated;
grant select on public.presence_changes to authenticated;

alter table public.presence_changes enable row level security;

drop policy if exists presence_changes_select_own on public.presence_changes;
create policy presence_changes_select_own on public.presence_changes
  for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

-- Sessions and their members are broadcast as they change; realtime applies
-- the select policies above, so an invitee hears about a session the moment
-- their member row lands and a stranger hears nothing. Presence itself is
-- not broadcast - the notices are, for the reason given at the top.
do $$
declare
  t text;
begin
  foreach t in array array['sessions', 'session_members', 'presence_changes'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
