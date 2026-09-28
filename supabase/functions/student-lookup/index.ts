import { createClient } from 'npm:@supabase/supabase-js@2'
import { enforceRateLimit, handleOptions, jsonResponse } from '../_shared/http.ts'

Deno.serve(async (request: Request) => {
  const optionsResponse = handleOptions(request)
  if (optionsResponse) return optionsResponse
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  const rateLimitResponse = await enforceRateLimit(request, 'student-lookup', 30, 60)
  if (rateLimitResponse) return rateLimitResponse

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Student lookup is not configured' }, 500)
  }

  let studentId = ''
  try {
    const body = await request.json()
    studentId = typeof body.student_id === 'string' ? body.student_id.trim() : ''
  } catch {
    return jsonResponse({ error: 'Invalid request' }, 400)
  }

  if (!/^\d{5}$/.test(studentId)) return jsonResponse({ error: 'Student not found' }, 404)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: student } = await supabase
    .from('students')
    .select('student_id, current_status')
    .eq('student_id', studentId)
    .neq('current_status', 'ลาพัก')
    .maybeSingle()

  if (!student) return jsonResponse({ error: 'Student not found' }, 404)

  const { data: academic } = await supabase
    .from('student_academic_records')
    .select('number, sex, name, surname, class, academic_year')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .maybeSingle()

  if (!academic) return jsonResponse({ error: 'Student not found' }, 404)

  return jsonResponse({
    student: {
      student_id: student.student_id,
      number: academic.number,
      sex: academic.sex,
      name: academic.name,
      surname: academic.surname,
      class_name: academic.class,
      academic_year: academic.academic_year,
      status: student.current_status,
    },
  })
})