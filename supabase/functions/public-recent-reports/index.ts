import { createClient } from 'npm:@supabase/supabase-js@2'
import { enforceRateLimit, handleOptions, jsonResponse } from '../_shared/http.ts'

type ServiceRecord = {
  id: number
  service_datetime: string
  student_id: string
  academic_record_id: string
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

Deno.serve(async (request: Request) => {
  const optionsResponse = handleOptions(request)
  if (optionsResponse) return optionsResponse
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  const rateLimitResponse = await enforceRateLimit(request, 'public-recent-reports', 30, 60)
  if (rateLimitResponse) return rateLimitResponse

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: 'Report service is not configured' }, 503)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid request' }, 400)
  }

  const isStatusRequest = body.action === 'status'
  const dateFrom = body.date_from
  const dateTo = body.date_to
  const page = body.page
  const pageSize = body.page_size
  if (!isStatusRequest && (!isDateKey(dateFrom) || !isDateKey(dateTo) || dateFrom > dateTo)) {
    return jsonResponse({ error: 'Invalid date range' }, 400)
  }
  if (!isStatusRequest && (
    typeof page !== 'number' || !Number.isSafeInteger(page) || page < 1
    || typeof pageSize !== 'number' || ![10, 25, 50, 100].includes(pageSize)
  )) {
    return jsonResponse({ error: 'Invalid page settings' }, 400)
  }

  let startDate: Date | undefined
  let endDate: Date | undefined
  if (!isStatusRequest) {
    startDate = new Date(`${dateFrom as string}T00:00:00+07:00`)
    endDate = new Date(`${dateTo as string}T00:00:00+07:00`)
    endDate.setUTCDate(endDate.getUTCDate() + 1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: settings, error: settingsError } = await supabase
    .from('system_settings')
    .select('public_reports_enabled')
    .eq('id', 1)
    .maybeSingle()

  if (settingsError) return jsonResponse({ error: 'Report service is unavailable' }, 503)
  if (isStatusRequest) return jsonResponse({ enabled: settings?.public_reports_enabled === true })
  if (!settings?.public_reports_enabled) return jsonResponse({ error: 'Report is not available' }, 404)

  const rangeStart = ((page as number) - 1) * (pageSize as number)
  const rangeEnd = rangeStart + (pageSize as number) - 1
  const { data: records, count, error: recordsError } = await supabase
    .from('service_records')
    .select('id, service_datetime, student_id, academic_record_id', { count: 'exact' })
    .gte('service_datetime', startDate?.toISOString() ?? '')
    .lt('service_datetime', endDate?.toISOString() ?? '')
    .order('service_datetime', { ascending: false })
    .range(rangeStart, rangeEnd)

  if (recordsError) return jsonResponse({ error: 'Unable to load reports' }, 500)
  const pageRecords = (records ?? []) as ServiceRecord[]
  if (pageRecords.length === 0) return jsonResponse({ records: [], total: count ?? 0 })

  const recordIds = pageRecords.map((record) => record.id)
  const academicIds = [...new Set(pageRecords.map((record) => record.academic_record_id))]
  const [itemsResult, studentsResult, catalogResult] = await Promise.all([
    supabase.from('service_record_items').select('record_id, item_id, other_detail').in('record_id', recordIds),
    supabase.from('student_academic_records').select('id, number, name, surname, class').in('id', academicIds),
    supabase.from('service_item_types').select('id, code, name'),
  ])

  if (itemsResult.error || studentsResult.error || catalogResult.error) {
    return jsonResponse({ error: 'Unable to load report details' }, 500)
  }

  const studentByAcademicId = new Map((studentsResult.data ?? []).map((student) => [student.id, student]))
  const itemById = new Map((catalogResult.data ?? []).map((item) => [item.id, item]))
  const itemsByRecord = new Map<number, Array<{ code: string; label: string; detail: string | null }>>()

  for (const item of itemsResult.data ?? []) {
    const catalogItem = itemById.get(item.item_id)
    if (!catalogItem) continue
    const recordItems = itemsByRecord.get(item.record_id) ?? []
    recordItems.push({ code: catalogItem.code, label: catalogItem.name, detail: item.other_detail })
    itemsByRecord.set(item.record_id, recordItems)
  }

  return jsonResponse({
    records: pageRecords.map((record) => {
      const student = studentByAcademicId.get(record.academic_record_id)
      return {
        service_datetime: record.service_datetime,
        name: student?.name ?? '',
        surname: student?.surname ?? '',
        class_name: student?.class ?? '',
        number: student?.number ?? null,
        items: itemsByRecord.get(record.id) ?? [],
      }
    }),
    total: count ?? 0,
  })
})