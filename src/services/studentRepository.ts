import { getServiceRecords, getStudentDirectory } from './browserDataStore'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { ServiceRecord, Student } from '../types'

export type ServiceHistoryRecord = ServiceRecord & { student?: Student }

export async function getCurrentStudentRoster(): Promise<Student[]> {
  if (!isSupabaseConfigured || !supabase) return getStudentDirectory()

  const { data, error } = await supabase
    .from('student_academic_records')
    .select('student_id, number, sex, name, surname, class, academic_year, students!inner(current_status)')
    .eq('is_active', true)

  if (error) throw new Error('โหลดรายชื่อนักเรียนปัจจุบันไม่สำเร็จ')

  return (data ?? []).map((record) => {
    const profile = record.students as unknown as { current_status: Student['status'] }
    return {
      student_id: record.student_id,
      number: record.number ?? 0,
      sex: record.sex as Student['sex'],
      name: record.name,
      surname: record.surname,
      class_name: record.class,
      academic_year: record.academic_year,
      status: profile.current_status,
    }
  })
}

export async function getServiceHistory(): Promise<ServiceHistoryRecord[]> {
  if (!isSupabaseConfigured || !supabase) {
    const studentsById = new Map(getStudentDirectory().map((student) => [student.student_id, student]))
    return getServiceRecords().map((record) => ({ ...record, student: studentsById.get(record.student_id) }))
  }

  const { data: records, error: recordsError } = await supabase
    .from('service_records')
    .select('id, service_datetime, student_id, academic_record_id')
    .order('service_datetime', { ascending: false })

  if (recordsError) throw new Error('โหลดประวัติการใช้บริการไม่สำเร็จ')
  if (!records?.length) return []

  const recordIds = records.map((record) => record.id)
  const academicIds = [...new Set(records.map((record) => record.academic_record_id))]
  const [itemsResult, academicsResult, catalogResult] = await Promise.all([
    supabase.from('service_record_items').select('record_id, item_id, other_detail').in('record_id', recordIds),
    supabase.from('student_academic_records').select('id, student_id, number, sex, name, surname, class, academic_year').in('id', academicIds),
    supabase.from('service_item_types').select('id, code'),
  ])

  if (itemsResult.error || academicsResult.error || catalogResult.error) {
    throw new Error('โหลดรายละเอียดประวัติการใช้บริการไม่สำเร็จ')
  }

  const academicById = new Map((academicsResult.data ?? []).map((academic) => [academic.id, academic]))
  const itemCodeById = new Map((catalogResult.data ?? []).map((item) => [item.id, item.code]))
  const itemsByRecordId = new Map<number, string[]>()

  for (const item of itemsResult.data ?? []) {
    const code = itemCodeById.get(item.item_id)
    if (!code) continue
    const selectedItem = code === 'other' && item.other_detail
      ? `other:${item.other_detail}`
      : code
    const selected = itemsByRecordId.get(item.record_id) ?? []
    selected.push(selectedItem)
    itemsByRecordId.set(item.record_id, selected)
  }

  return records.map((record) => {
    const academic = academicById.get(record.academic_record_id)
    const student: Student | undefined = academic ? {
      student_id: academic.student_id,
      number: academic.number ?? 0,
      sex: academic.sex as Student['sex'],
      name: academic.name,
      surname: academic.surname,
      class_name: academic.class,
      academic_year: academic.academic_year,
      status: 'ปกติ',
    } : undefined

    return {
      id: Number(record.id),
      service_datetime: record.service_datetime,
      student_id: record.student_id,
      selected_items: itemsByRecordId.get(record.id) ?? [],
      student,
    }
  })
}
