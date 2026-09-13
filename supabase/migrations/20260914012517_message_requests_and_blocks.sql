-- Message requests and blocks.
--
-- Messaging used to be mutual-only: the database refused a conversation
-- between two people unless each followed the other. That rule came from the
-- arcade research about strangers, and it still shapes what a stranger gets -
-- but it also meant a person with nobody in their circle could not reach the
-- one player they had just met. So the rule becomes the one social networks
-- settle on: mutuals talk straight away, anyone else can send one message
-- that arrives as a request, and the recipient decides.
--
-- What changes:
--
--   conversations  gains a status (pending, accepted, declined), who asked,
--                  and when it was answered. Every row that already exists is
--                  accepted, so nothing in flight changes.
--   blocks         a new table: who has blocked whom. A block ends contact
--                  in both directions and tells the blocked person nothing.
--   sending        the insert policy on messages allows a message when the
--                  conversation is accepted, or the two follow each other, or
--                  it is your own pending request. A trigger holds a pending
--                  request to one message from the requester until it is
--                  answered, so nobody can pile twenty messages onto a
--                  stranger.
--   answering      accept_request, decline_request, block_user and
--                  unblock_user are the only ways a request changes state.
--                  Clients are granted no update on conversations at all, so
--                  nobody can answer a request that was not sent to them.
--   deleting       the follow-notice trigger from the previous migration is
--                  replaced, because deleting an account cascades through
--                  follows and the trigger then tried to write a notice for
--                  a profile that no longer existed, which stopped the
--                  deletion. Notices are now only written for people who
--                  are still here.
--
-- Applies on top of the two migrations already live. Nothing they created is
-- altered except by addition: new columns with defaults, new policies in
-- place of the two that encoded the mutual rule, and one function that is
-- replaced because its result type changes. Safe to run more than once.

-- ---------------------------------------------------------------------------
-- conversations: request state
-- ---------------------------------------------------------------------------

-- requested_by cascades like the two participant columns do: the requester
-- is one of them, so their conversation goes when they do, and no cascade
-- order can leave a pending row without a requester on the way out.
alter table public.conversations
  add column if not exists status text not null default 'accepted',
  add column if not exists requested_by uuid references public.profiles (id) on delete cascade,
  add column if not exists accepted_at timestamptz,
  add column if not exists declined_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.conversations'::regclass
      and conname = 'conversations_status_check'
  ) then
    alter table public.conversations
      add constraint conversations_status_check
      check (status in ('pending', 'accepted', 'declined'));
  end if;

  -- A pending or declined conversation always knows who asked.
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.conversations'::regclass
      and conname = 'conversations_request_has_requester'
  ) then
    alter table public.conversations
      add constraint conversations_request_has_requester
      check (status = 'accepted' or requested_by is not null);
  end if;
end;
$$;

create index if not exists conversations_requested_by_idx
  on public.conversations (requested_by)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- blocks
-- ---------------------------------------------------------------------------

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocked_idx
  on public.blocks (blocked_id);

-- Either direction. Security definer so it can be asked about a pair that
-- includes someone whose block rows the caller must never read.
create or replace function public.is_blocked_between(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = p_a and blocked_id = p_b)
       or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

revoke all on function public.is_blocked_between(uuid, uuid) from public;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;

-- Privileges: you can read who you have blocked. Writing goes through the
-- two functions below, so there is no insert or delete grant.
revoke all on public.blocks from anon;
revoke all on public.blocks from authenticated;
grant select on public.blocks to authenticated;

alter table public.blocks enable row level security;

drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own on public.blocks
  for select to authenticated
  using (blocker_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Who can see and send
-- ---------------------------------------------------------------------------

-- A conversation is yours to see if you are in it and neither of you has
-- blocked the other. The block hides the thread from both sides: the blocker
-- asked not to hear from this person, and the blocked person is told nothing
-- beyond the thread being gone.
create or replace function public.can_view_conversation(p_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conversation
      and (c.user_a = auth.uid() or c.user_b = auth.uid())
      and not public.is_blocked_between(c.user_a, c.user_b)
  );
$$;

revoke all on function public.can_view_conversation(uuid) from public;
grant execute on function public.can_view_conversation(uuid) to authenticated;

-- Whether the caller may put a message into this conversation right now.
-- Accepted, or mutual (which counts as accepted whatever the row says), or
-- the caller's own pending request. The one-message limit on a pending
-- request is a trigger below, because it has to hold under concurrent sends.
create or replace function public.can_send_message(p_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conversation
      and (c.user_a = auth.uid() or c.user_b = auth.uid())
      and not public.is_blocked_between(c.user_a, c.user_b)
      and (
        c.status = 'accepted'
        or public.is_mutual(c.user_a, c.user_b)
        or (c.status = 'pending' and c.requested_by = auth.uid())
      )
  );
$$;

revoke all on function public.can_send_message(uuid) from public;
grant execute on function public.can_send_message(uuid) to authenticated;

-- One message while a request is unanswered. Serialised per conversation
-- with an advisory lock so two sends racing each other cannot both get in.
create or replace function public.guard_request_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv public.conversations;
begin
  select * into conv from public.conversations where id = new.conversation_id;
  if conv.id is null then
    raise exception 'no such conversation' using errcode = '23503';
  end if;

  if conv.status = 'pending'
     and not public.is_mutual(conv.user_a, conv.user_b) then
    perform pg_advisory_xact_lock(hashtext(conv.id::text));
    if exists (
      select 1 from public.messages
      where conversation_id = conv.id and sender_id = new.sender_id
    ) then
      raise exception 'request already sent' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_request_message() from public;

drop trigger if exists messages_guard_request on public.messages;
create trigger messages_guard_request
  before insert on public.messages
  for each row execute function public.guard_request_message();

-- ---------------------------------------------------------------------------
-- Opening a conversation
-- ---------------------------------------------------------------------------

-- Replaces the mutual-only version. The caller is the app sending a first
-- message: with a mutual the conversation is accepted from the start; with
-- anyone else it is a pending request from the caller. An existing row is
-- returned as it is, whatever its state, so the app can show the right
-- thing. A block in either direction is refused with the same words in both
-- directions, so the refusal itself says nothing about who blocked whom.
--
-- The result type changes from the id to the whole row, which is why the old
-- function is dropped rather than replaced.
drop function if exists public.get_or_create_conversation(uuid);

create or replace function public.get_or_create_conversation(p_other uuid)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  conv public.conversations;
  pending_today integer;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_other is null or p_other = me then
    raise exception 'cannot message yourself' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_other) then
    raise exception 'no such person' using errcode = '22023';
  end if;
  if public.is_blocked_between(me, p_other) then
    raise exception 'cannot message this person' using errcode = '42501';
  end if;

  if me < p_other then a := me; b := p_other; else a := p_other; b := me; end if;

  select * into conv from public.conversations where user_a = a and user_b = b;
  if conv.id is not null then
    return conv;
  end if;

  if public.is_mutual(me, p_other) then
    insert into public.conversations (user_a, user_b, status, accepted_at)
    values (a, b, 'accepted', now())
    on conflict (user_a, user_b) do nothing;
  else
    -- Twenty unanswered requests in a day is a campaign, not a conversation.
    select count(*) into pending_today
    from public.conversations
    where requested_by = me
      and status = 'pending'
      and created_at > now() - interval '1 day';
    if pending_today >= 20 then
      raise exception 'too many requests today' using errcode = '42501';
    end if;

    insert into public.conversations (user_a, user_b, status, requested_by)
    values (a, b, 'pending', me)
    on conflict (user_a, user_b) do nothing;
  end if;

  select * into conv from public.conversations where user_a = a and user_b = b;
  return conv;
end;
$$;

revoke all on function public.get_or_create_conversation(uuid) from public;
grant execute on function public.get_or_create_conversation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Answering a request
-- ---------------------------------------------------------------------------

-- Only the person the request was sent to can answer it, and only while it
-- is unanswered. Both return the row as it now stands.
create or replace function public.accept_request(p_conversation uuid)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv public.conversations;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  update public.conversations
     set status = 'accepted', accepted_at = now(), declined_at = null
   where id = p_conversation
     and status in ('pending', 'declined')
     and (user_a = me or user_b = me)
     and requested_by is distinct from me
     and not public.is_blocked_between(user_a, user_b)
  returning * into conv;

  if conv.id is null then
    raise exception 'not a request you can answer' using errcode = '42501';
  end if;
  return conv;
end;
$$;

create or replace function public.decline_request(p_conversation uuid)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv public.conversations;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  update public.conversations
     set status = 'declined', declined_at = now()
   where id = p_conversation
     and status = 'pending'
     and (user_a = me or user_b = me)
     and requested_by is distinct from me
  returning * into conv;

  if conv.id is null then
    raise exception 'not a request you can answer' using errcode = '42501';
  end if;
  return conv;
end;
$$;

revoke all on function public.accept_request(uuid) from public;
revoke all on function public.decline_request(uuid) from public;
grant execute on function public.accept_request(uuid) to authenticated;
grant execute on function public.decline_request(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Blocking
-- ---------------------------------------------------------------------------

-- Blocking ends the follow in both directions as well, so the blocked person
-- drops off every mutual-only surface at once. Their side sees an unfollow,
-- which is what it is. Blocking twice is harmless.
create or replace function public.block_user(p_other uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_other is null or p_other = me then
    raise exception 'cannot block yourself' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_other) then
    raise exception 'no such person' using errcode = '22023';
  end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (me, p_other)
  on conflict (blocker_id, blocked_id) do nothing;

  delete from public.follows
  where (follower_id = me and following_id = p_other)
     or (follower_id = p_other and following_id = me);
end;
$$;

create or replace function public.unblock_user(p_other uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  delete from public.blocks where blocker_id = me and blocked_id = p_other;
end;
$$;

revoke all on function public.block_user(uuid) from public;
revoke all on function public.unblock_user(uuid) from public;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.unblock_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Follow notices, account deletion
-- ---------------------------------------------------------------------------

-- Same trigger as before with one difference: a notice is only written for
-- a person who still has a profile. When an account is deleted its follows
-- cascade away, this trigger runs for each of them, and the deleted person
-- is by then no longer in profiles - so writing them a notice failed on the
-- foreign key and rolled the whole deletion back. The other person in each
-- edge still gets theirs, which is what makes the deleted account drop off
-- their lists live.
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
  select pair.user_id, pair.other_id, change
  from (values
    (edge.follower_id, edge.following_id),
    (edge.following_id, edge.follower_id)
  ) as pair (user_id, other_id)
  where exists (select 1 from public.profiles where id = pair.user_id)
    and exists (select 1 from public.profiles where id = pair.other_id);

  delete from public.follow_changes
  where created_at < now() - interval '1 day';

  return null;
end;
$$;

revoke all on function public.notify_follow_change() from public;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- conversations: still participants only, now minus anything blocked.
-- Creation and every change of state go through the functions above, so
-- there is still no insert policy and there is no update policy.
drop policy if exists conversations_select_participant on public.conversations;
create policy conversations_select_participant on public.conversations
  for select to authenticated
  using (public.can_view_conversation(id));

-- messages: read what you can see; send only as yourself and only where
-- can_send_message says so; mark read only on messages sent to you, in a
-- conversation you can still see.
drop policy if exists messages_select_participant on public.messages;
create policy messages_select_participant on public.messages
  for select to authenticated
  using (public.can_view_conversation(conversation_id));

drop policy if exists messages_insert_own on public.messages;
create policy messages_insert_own on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.can_send_message(conversation_id)
  );

drop policy if exists messages_mark_read on public.messages;
create policy messages_mark_read on public.messages
  for update to authenticated
  using (public.can_view_conversation(conversation_id) and sender_id <> auth.uid())
  with check (public.can_view_conversation(conversation_id) and sender_id <> auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

-- A request being accepted is a change to the conversation row, and the
-- person who asked should see their composer open without a reload. Only
-- inserts and updates are consumed, both of which realtime filters through
-- the select policy above.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end;
$$;
