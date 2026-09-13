# Supabase setup

Accounts, follows and private messages run on a Supabase project. Everything
else in the prototype (venues, queues, presence, clips, scores, sessions) is
still local sample data and needs nothing from this page.

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

## 4. Apply the database migration

The schema lives in `supabase/migrations/20260913140043_accounts_and_messaging.sql`.

Either:

- **SQL editor** — open **SQL Editor** in the dashboard, paste the whole file,
  and run it. It is safe to run more than once.
- **Supabase CLI** — with the CLI installed and logged in,
  `supabase link --project-ref <your ref>` then `supabase db push`.

The migration creates `profiles`, `follows`, `conversations` and `messages`,
turns on row level security with the policies described in the file, adds a
trigger that creates a profile when an account is created, and the two
functions the app calls (`handle_available`, `get_or_create_conversation`).

## 5. Email confirmation

Under **Authentication → Providers → Email**, *Confirm email* is on by
default. With it on, creating an account sends a confirmation link and the
app says "Check your email to confirm your account" until the link is
clicked. For a quick test session with throwaway addresses, turning it off
lets a new account sign in immediately. Either setting works with the app.

## 6. Realtime

The migration adds `messages` to the `supabase_realtime` publication so open
conversations update live. If that statement fails on your project, open
**Database → Publications**, pick `supabase_realtime`, and toggle on
`public.messages`. Realtime respects the same row level security as queries,
so a client only ever receives messages from conversations it is part of.

## 7. Test with two accounts

1. Run `npm run dev` and open the app in a normal window. Continue past the
   welcome screen, choose **Create account**, and make account A with a
   username, email and password.
2. Open the same URL in a private window (or another browser or phone) and
   create account B.
3. In each window go to **Me → Following** (or Followers) and search the
   other username, then **Follow**. Once both have followed, each profile
   shows **Mutual**.
4. Open the other person's profile and tap **Message**. Send something from A;
   it appears in B's open thread without a reload. Reply from B; it appears
   for A. Reload either window and the thread is still there.
5. **Me → Sign out** returns to the sign-in screen with nothing of the
   previous account left on screen.

Two accounts that do not follow each other can see each other's profile and
follow, but have no message box, and the database refuses a conversation
between them regardless of what the client asks.
