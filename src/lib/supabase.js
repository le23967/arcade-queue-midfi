import { createClient } from '@supabase/supabase-js'

/* One Supabase client for the whole app.

   Both values are public by design - the URL and the publishable key are what
   a browser is meant to hold - and access is governed by row level security
   on the server, not by anything in here. The service role key and the
   database password must never appear in this bundle.

   When the two variables are missing the export is null rather than a client
   that would throw on first use, so the prototype can still render and tell
   the person what is missing. `VITE_SUPABASE_ANON_KEY` is accepted for
   projects that still use the older key name. */
const url = import.meta.env.VITE_SUPABASE_URL
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && key)

export const supabase = supabaseConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
