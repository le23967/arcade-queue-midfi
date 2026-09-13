-- Phase 1: real accounts, follows, and private messaging.
--
-- Four tables, all behind row level security. Everything else in the app
-- (venues, queues, presence, clips, scores, planned sessions) stays as
-- prototype data on the client for now.
--
-- Apply with the Supabase CLI (`supabase db push`) or by pasting the whole
-- file into the SQL editor of the project. It is written to be run once on an
-- empty project; every statement is guarded so a second run is harmless.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null,
  avatar_hue text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Same rule as the app's Edit profile screen: letters, digits, underscore.
  constraint profiles_handle_format check (handle ~ '^[A-Za-z0-9_]{2,16}$')
);

-- Uniqueness is case-insensitive, so "Mia" and "mia" cannot both exist.
create unique index if not exists profiles_handle_lower_idx
  on public.profiles (lower(handle));

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Is a handle free? Callable before sign-up, when there is no session yet.
-- Security definer so an anonymous caller can ask without being able to read
-- the profiles table itself.
create or replace function public.handle_available(p_handle text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_handle ~ '^[A-Za-z0-9_]{2,16}$'
     and not exists (
       select 1 from public.profiles where lower(handle) = lower(p_handle)
     );
$$;

revoke all on function public.handle_available(text) from public;
grant execute on function public.handle_available(text) to anon, authenticated;

-- A profile is created the moment an auth user is, from the handle supplied at
-- sign-up. Doing it here rather than from the browser means the profile exists
-- even when email confirmation is on and the user has no session yet. If the
-- chosen handle was taken in the meantime, or missing, a placeholder is used
-- so the sign-up itself never fails; the person can rename in Edit profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wanted text := nullif(btrim(new.raw_user_meta_data ->> 'handle'), '');
  chosen text;
begin
  if wanted is not null
     and wanted ~ '^[A-Za-z0-9_]{2,16}$'
     and not exists (select 1 from public.profiles where lower(handle) = lower(wanted))
  then
    chosen := wanted;
  else
    chosen := 'player_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, handle)
  values (new.id, chosen)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

create index if not exists follows_following_idx
  on public.follows (following_id);

-- Mutual is derived, never stored: A follows B and B follows A.
create or replace function public.is_mutual(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.follows where follower_id = p_a and following_id = p_b)
     and exists (select 1 from public.follows where follower_id = p_b and following_id = p_a);
$$;

revoke all on function public.is_mutual(uuid, uuid) from public;
grant execute on function public.is_mutual(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------

-- Exactly two people. Participants are stored in a fixed order (user_a < user_b)
-- and that ordered pair is unique, so A<->B and B<->A cannot both exist no
-- matter what a client sends.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint conversations_not_self check (user_a <> user_b),
  constraint conversations_ordered check (user_a < user_b),
  constraint conversations_pair_unique unique (user_a, user_b)
);

create index if not exists conversations_user_b_idx
  on public.conversations (user_b);

create or replace function public.is_participant(p_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversations
    where id = p_conversation
      and (user_a = auth.uid() or user_b = auth.uid())
  );
$$;

revoke all on function public.is_participant(uuid) from public;
grant execute on function public.is_participant(uuid) to authenticated;

-- The only way a client gets a conversation. It orders the pair itself,
-- refuses a conversation with yourself, and refuses one with anybody you do
-- not follow both ways - the same rule the app shows on a profile.
create or replace function public.get_or_create_conversation(p_other uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  conv uuid;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_other is null or p_other = me then
    raise exception 'cannot message yourself' using errcode = '22023';
  end if;
  if not public.is_mutual(me, p_other) then
    raise exception 'messaging is between people who follow each other' using errcode = '42501';
  end if;

  if me < p_other then a := me; b := p_other; else a := p_other; b := me; end if;

  insert into public.conversations (user_a, user_b)
  values (a, b)
  on conflict (user_a, user_b) do nothing;

  select id into conv from public.conversations where user_a = a and user_b = b;
  return conv;
end;
$$;

revoke all on function public.get_or_create_conversation(uuid) from public;
grant execute on function public.get_or_create_conversation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint messages_text_not_blank check (btrim(text) <> ''),
  constraint messages_text_length check (char_length(text) <= 1000)
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

-- Supabase grants new tables to anon and authenticated by default. Nothing
-- here is for anonymous callers, and only one column of messages may ever be
-- updated by anyone: read_at, by the person reading.
revoke all on public.profiles, public.follows, public.conversations, public.messages from anon;

revoke all on public.profiles from authenticated;
grant select, insert, update on public.profiles to authenticated;

revoke all on public.follows from authenticated;
grant select, insert, delete on public.follows to authenticated;

revoke all on public.conversations from authenticated;
grant select on public.conversations to authenticated;

revoke all on public.messages from authenticated;
grant select, insert on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- profiles: anyone signed in can find people; only you can write yours.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- follows: you can see every edge that touches you, which is enough to know
-- who you follow, who follows you, and whether someone is mutual. You can
-- only ever write edges that start at you.
drop policy if exists follows_select_own on public.follows;
create policy follows_select_own on public.follows
  for select to authenticated
  using (follower_id = auth.uid() or following_id = auth.uid());

drop policy if exists follows_insert_own on public.follows;
create policy follows_insert_own on public.follows
  for insert to authenticated
  with check (follower_id = auth.uid());

drop policy if exists follows_delete_own on public.follows;
create policy follows_delete_own on public.follows
  for delete to authenticated
  using (follower_id = auth.uid());

-- conversations: participants only. Creation goes through the function
-- above, so there is deliberately no insert policy.
drop policy if exists conversations_select_participant on public.conversations;
create policy conversations_select_participant on public.conversations
  for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

-- messages: read if you are in the conversation; send only as yourself, into
-- a conversation you are in, to someone you still follow both ways; mark
-- read only on messages sent to you.
drop policy if exists messages_select_participant on public.messages;
create policy messages_select_participant on public.messages
  for select to authenticated
  using (public.is_participant(conversation_id));

drop policy if exists messages_insert_own on public.messages;
create policy messages_insert_own on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_participant(conversation_id)
    and public.is_mutual(
      auth.uid(),
      (select case when c.user_a = auth.uid() then c.user_b else c.user_a end
         from public.conversations c where c.id = conversation_id)
    )
  );

drop policy if exists messages_mark_read on public.messages;
create policy messages_mark_read on public.messages
  for update to authenticated
  using (public.is_participant(conversation_id) and sender_id <> auth.uid())
  with check (public.is_participant(conversation_id) and sender_id <> auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

-- New and updated rows in messages are broadcast to subscribed clients.
-- Realtime applies the same row level security, so a subscriber only ever
-- receives rows from conversations they are in. If this statement fails in
-- your project, add the table under Database -> Publications instead.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

-- read_at is the only column that changes, and a subscriber needs the full
-- row to know which message it was.
alter table public.messages replica identity full;
