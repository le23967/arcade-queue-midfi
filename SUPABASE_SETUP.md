# Supabase setup

Accounts, follows, private messages, message requests, blocks, planned
sessions, who is checked in where, and account deletion run on a Supabase
project. Everything else in the prototype (venues, queue figures, clips,
scores) is still local sample data and needs nothing from this page.

## 1. Create a project

Sign in at https://supabase.com, create a new project, and choose a strong
database password when asked. You will not need that password in the app;
keep it somewhere safe and never put it in this repository.

## 2. Find the two public values

In the project dashboard open **Project Settings → API**.

- **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
- **Publishable key** — under *API keys*, the key labelled publishable
  (`sb_publishable_…`). On older projects this is called the **anon** key
  instead; either works.

Both values are meant to be shipped to the browser. Do **not** copy the
`service_role` key, the JWT secret or the database password anywhere near the
app.

## 3. Local environment variables

Copy `.env.example` to `.env.local` and fill it in:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

`.env.local` is ignored by git. If you have an older project with only an anon
key, `VITE_SUPABASE_ANON_KEY` is accepted in place of the publishable key.

Restart `npm run dev` after changing env files; Vite reads them at start-up.

Without these two values the app still runs, but the sign-in screen says
accounts are not set up and offers a look around without an account.

## 4. Apply the database migrations

The schema lives in `supabase/migrations/`, one file per step, applied in
filename order:

1. `20260913140043_accounts_and_messaging.sql` — `profiles`, `follows`,
   `conversations` and `messages`, row level security with the policies
   described in the file, a trigger that creates a profile when an account is
   created, and the two functions the app calls (`handle_available`,
   `get_or_create_conversation`).
2. `20260913144547_follow_changes_realtime.sql` — a small `follow_changes`
   table and trigger so a follow or unfollow made in one browser reaches the
   other person live. The file explains why `follows` itself is not
   broadcast.
3. `20260914012517_message_requests_and_blocks.sql` — message requests and
   blocks. Conversations gain a status (`pending`, `accepted`, `declined`),
   who asked and when it was answered; a `blocks` table; the functions the
   app calls to accept, decline, block and unblock; a trigger that holds an
   unanswered request to one message; and a fix to the follow-notice trigger
   so that deleting an account no longer fails on its own cascade. Existing
   conversations are `accepted` and keep every message.
4. `20260914051543_sessions_and_presence.sql` — planned sessions
   (`sessions`, `session_members`) and check-ins (`presence`), shared between
   accounts, with a `presence_changes` notice table so a check-out or going
   hidden reaches mutuals live. A closed session is visible to its host and
   the people on it; an open one to anyone signed in; presence only to
   people you follow both ways, while you are checked in and visible.

Either:

- **SQL editor** — open **SQL Editor** in the dashboard, paste each file in
  turn, and run it. All four are safe to run more than once.
- **Supabase CLI** — with the CLI installed and logged in,
  `supabase link --project-ref <your ref>` then `supabase db push`.

If the project already has the earlier ones applied, run only the ones it
is missing, in order.

## 5. Email confirmation

Under **Authentication → Providers → Email**, *Confirm email* is on by
default. With it on, creating an account sends a confirmation link and the
app says "Check your email to confirm your account" until the link is
clicked. For a quick test session with throwaway addresses, turning it off
lets a new account sign in immediately. Either setting works with the app.

## 6. Realtime

The migrations add `messages` and `follow_changes` to the `supabase_realtime`
publication, so open conversations and follow state update live. If either
statement fails on your project, open **Database → Publications**, pick
`supabase_realtime`, and toggle on `public.messages` and
`public.follow_changes`. Realtime respects the same row level security as
queries, so a client only ever receives messages from conversations it is
part of and follow notices addressed to it.

## 7. Deploy the delete-account function

Deleting an account needs the service role, which must never reach the
browser, so it runs as an Edge Function: `supabase/functions/delete-account/index.ts`.
The function reads who is calling from the session token, deletes that auth
user and nothing else, and the database cascades take the profile, follows,
conversations and messages with it. It uses the `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` values the platform provides to every function;
there is nothing to configure by hand and nothing to add to `.env.local`.

Either:

- **Dashboard** — open **Edge Functions**, choose **Deploy a new function**,
  then **Via Editor**. Name it exactly `delete-account`, replace the editor's
  contents with the whole of `supabase/functions/delete-account/index.ts`,
  and deploy. Leave *Verify JWT* on.
- **Supabase CLI** — with the CLI installed and logged in, from the repository
  root: `supabase link --project-ref <your ref>` (run `supabase init` first if
  `supabase/config.toml` does not exist yet - it keeps the migrations folder),
  then `supabase functions deploy delete-account`.

Until it is deployed, **Me → Account → Delete account** reports that the
function is not reachable and nothing is deleted.

## 8. Test with two accounts

1. Run `npm run dev` and open the app in a normal window. Continue past the
   welcome screen, choose **Create account**, and make account A with a
   username, email and password.
2. Open the same URL in a private window (or another browser or phone) and
   create account B.
3. In A, open **Circle**, tap the add-person icon, and search B's username.
   Tap **Follow**. B's **Me** tab shows the new follower without a reload.
4. Still in A, open B's profile and tap **Message**. The thread says the
   first message goes as a request; send one. A sees **Request sent** and
   no composer. In B, the Messages icon on Circle shows **1**; open it, pick
   **Requests**, open the request, and tap **Accept**. A's composer opens
   without a reload, and messages now flow both ways live.
5. Decline instead of accept, and the request leaves B's list while A still
   sees only **Request sent**. **Block** and A can no longer open a
   conversation with B at all; B's view of A's profile offers **Unblock**.
6. Reload either window and everything is still there.
7. Once A and B follow each other: in A, **Arcades → a venue → Join queue →
   Manual → Join queue**. B's Circle map now shows A at that venue without a
   reload, and the list has **Join** on A's row; **Notify them** sends A a
   message. Reload A and the queue banner is still there. **Check Out** in A
   takes A off B's map.
8. In A, **Circle → Later → Plan**, pick B, **Send to 1**. B's Later shows the
   session as **Invited you** at once; **I'm in** on it tells A and A's card
   counts B as going. **Change** the time in A and B's card changes, with a
   message; **Call it off** and it leaves B's Later, with a message.
9. **Me → Account → Sign out** returns to the sign-in screen with nothing of
   the previous account left on screen. **Delete account** asks for the
   username, then removes the account and everything it owned.

The database enforces all of this: a request is one message until answered,
only the person it was sent to can answer it, a block hides the conversation
from both sides, and nobody can read or write a conversation they are not
part of.
