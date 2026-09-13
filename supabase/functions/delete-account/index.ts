// Delete the calling account.
//
// The browser cannot delete an auth user - that needs the service role, which
// must never reach a client - so it asks this function instead. Who is being
// deleted is decided here, from the session token the request carries, and
// from nothing else: the request body is ignored, there is no user id
// parameter to pass, and a token that does not resolve to a user gets 401.
//
// Deleting the auth user cascades through the schema: profiles references
// auth.users on delete cascade, and follows, follow_changes, blocks,
// conversations and messages all reference profiles the same way, so the
// person's rows go with them - including every conversation they were in,
// and therefore the other person's messages in those conversations. That is
// the trade-off of full deletion; it is deliberate for this build.
//
// Deploy with `supabase functions deploy delete-account`, or paste this file
// into a new function called delete-account in the dashboard's function
// editor. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided to every
// function by the platform; nothing has to be configured by hand.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ ok: false, error: 'Use POST.' }, 405)

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ ok: false, error: 'Not signed in.' }, 401)

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY')
  if (!url || !serviceKey) {
    return json({ ok: false, error: 'The function is missing its project settings.' }, 500)
  }

  // Privileged, and it never leaves this process.
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // The token names the caller. Anything else in the request is ignored.
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  const user = userData?.user
  if (userError || !user) return json({ ok: false, error: 'Not signed in.' }, 401)

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) {
    // The id is fine to log; the token and the key are not, and are not.
    console.error('delete-account: could not delete', user.id, deleteError.message)
    return json({ ok: false, error: 'Could not delete the account. Try again.' }, 500)
  }

  return json({ ok: true }, 200)
})
