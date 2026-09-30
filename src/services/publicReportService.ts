import { noteOptions, symptomOptions } from '../data/mockData'
import { getLocalDateKey } from '../lib/dateUtils'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getServiceHistory } from './studentRepository'

const REPORT_SETTING_KEY = 'hospital.public-reports-enabled'
const itemLabels = new Map([...symptomOptions, ...noteOptions].map((item) => [item.id, item.label]))

export type PublicReportItem = { code: string; label: string; detail: string | null }
export type PublicReportRecord = {
  service_datetime: string
  name: string
  surname: string
  class_name: string
  number: number | null
  items: PublicReportItem[]
}
export type PublicReportPage = { records: PublicReportRecord[]; total: number }

export async function getPublicReportsEnabled(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    try {
      return window.localStorage.getItem(REPORT_SETTING_KEY) === 'true'
    } catch {
      return false
    }
  }

  const { data, error } = await supabase.functions.invoke<{ enabled: boolean }>('public-recent-reports', {
    body: { action: 'status' },
  })
  if (error) throw new Error('ตรวจสอบสถานะรายงานสาธารณะไม่สำเร็จ')
  return data?.enabled === true
}

export async function setPublicReportsEnabled(enabled: boolean): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    window.localStorage.setItem(REPORT_SETTING_KEY, String(enabled))
    return
  }

  const { error } = await supabase
    .from('system_settings')
    .update({ public_reports_enabled: enabled })
    .eq('id', 1)
  if (error) throw new Error('บันทึกการตั้งค่ารายงานสาธารณะไม่สำเร็จ')
}

export async function getPublicReportPage(
  dateFrom: string,
  dateTo: string,
  page: number,
  pageSize: number,
): Promise<PublicReportPage> {
  if (!isSupabaseConfigured || !supabase) {
    const records = (await getServiceHistory())
      .filter((record) => {
        const date = getLocalDateKey(new Date(record.service_datetime))
        return date >= dateFrom && date <= dateTo
      })
      .sort((first, second) => second.service_datetime.localeCompare(first.service_datetime))
    const start = (page - 1) * pageSize
    return {
      total: records.length,
      records: records.slice(start, start + pageSize).map((record) => ({
        service_datetime: record.service_datetime,
        name: record.student?.name ?? '',
        surname: record.student?.surname ?? '',
        class_name: record.student?.class_name ?? '',
        number: record.student?.number ?? null,
        items: record.selected_items.map((selectedItem) => {
          const separator = selectedItem.indexOf(':')
          const code = separator < 0 ? selectedItem : selectedItem.slice(0, separator)
          return {
            code,
            label: itemLabels.get(code) ?? code,
            detail: separator < 0 ? null : selectedItem.slice(separator + 1).trim(),
          }
        }),
      })),
    }
  }

  const { data, error } = await supabase.functions.invoke<PublicReportPage>('public-recent-reports', {
    body: { date_from: dateFrom, date_to: dateTo, page, page_size: pageSize },
  })
  if (error) {
    const response = 'context' in error ? error.context : undefined
    if (response instanceof Response && response.status === 404) {
      throw new Error('รายงานนี้ปิดให้บริการแล้ว')
    }
    throw new Error('โหลดรายงานไม่สำเร็จ กรุณาลองใหม่')
  }
  return data ?? { records: [], total: 0 }
}
