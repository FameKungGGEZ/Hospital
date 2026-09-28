import { createClient } from 'npm:@supabase/supabase-js@2'
import { enforceRateLimit, handleOptions, jsonResponse } from '../_shared/http.ts'

Deno.serve(async (request: Request) => {
  const optionsResponse = handleOptions(request)
  if (optionsResponse) return optionsResponse
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  const rateLimitResponse = await enforceRateLimit(request, 'service-submit', 20, 60)
  if (rateLimitResponse) return rateLimitResponse

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Service submission is not configured' }, 500)
  }

  let studentId = ''
  let itemCodes: string[] = []
  let otherDetail: string | null = null
  try {
    const body = await request.json()
    studentId = typeof body.student_id === 'string' ? body.student_id.trim() : ''
    itemCodes = Array.isArray(body.item_codes) ? body.item_codes : []
    otherDetail = typeof body.other_detail === 'string' ? body.other_detail : null
  } catch {
    return jsonResponse({ error: 'Invalid request' }, 400)
  }

  if (!/^\d{5}$/.test(studentId) || itemCodes.length < 1 || itemCodes.length > 18) {
    return jsonResponse({ error: 'Invalid service record' }, 400)
  }
  if (!itemCodes.every((code) => typeof code === 'string' && /^[a-z][a-z0-9_]*$/.test(code))) {
    return jsonResponse({ error: 'Invalid service item' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await supabase.rpc('create_service_record', {
    p_student_id: studentId,
    p_item_codes: itemCodes,
    p_other_detail: otherDetail,
  })

  if (error) {
    const status = error.code === 'P0002' ? 404 : 400
    return jsonResponse({ error: status === 404 ? 'Student not found' : 'Unable to save service record' }, status)
  }

  return jsonResponse(data)
})