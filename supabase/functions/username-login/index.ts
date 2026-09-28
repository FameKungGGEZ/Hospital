import { createClient } from 'npm:@supabase/supabase-js@2'
import { enforceRateLimit, handleOptions, jsonResponse } from '../_shared/http.ts'

Deno.serve(async (request: Request) => {
  const optionsResponse = handleOptions(request)
  if (optionsResponse) return optionsResponse
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  const rateLimitResponse = await enforceRateLimit(request, 'username-login', 10, 300)
  if (rateLimitResponse) return rateLimitResponse

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Authentication service is not configured' }, 500)
  }

  let username = ''
  let password = ''
  try {
    const body = await request.json()
    username = typeof body.username === 'string' ? body.username.trim() : ''
    password = typeof body.password === 'string' ? body.password : ''
  } catch {
    return jsonResponse({ error: 'Invalid request' }, 400)
  }

  if (!username || !password || username.length > 100 || password.length > 256) {
    return jsonResponse({ error: 'Username or password is incorrect' }, 401)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: staff, error: staffError } = await adminClient
    .from('users')
    .select('id, active')
    .eq('username', username)
    .maybeSingle()

  if (staffError || !staff?.active) {
    return jsonResponse({ error: 'Username or password is incorrect' }, 401)
  }

  const { data: authUser, error: authUserError } = await adminClient.auth.admin.getUserById(staff.id)
  if (authUserError || !authUser.user.email) {
    return jsonResponse({ error: 'Username or password is incorrect' }, 401)
  }

  const { data, error } = await authClient.auth.signInWithPassword({
    email: authUser.user.email,
    password,
  })

  if (error || !data.session) {
    return jsonResponse({ error: 'Username or password is incorrect' }, 401)
  }

  return jsonResponse({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
})