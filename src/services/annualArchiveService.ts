import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  createHistoryExamplePdf,
  createHistoryExampleWorkbook,
  createIllnessStatisticsPdf,
  createIllnessStatisticsWorkbook,
} from './fileExportService'
import { getCurrentStudentRoster } from './studentRepository'

const ARCHIVE_BUCKET = 'annual-report-archives'

export type AnnualReportArchive = {
  id: string
  academic_year: string
  history_xlsx_path: string
  history_pdf_path: string
  statistics_xlsx_path: string
  statistics_pdf_path: string
  created_at: string
}

export async function createAnnualBackupAndArchive(academicYear: string): Promise<number> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('ต้องเชื่อมต่อ Supabase เพื่อเก็บไฟล์สำรองและ archive รายชื่อ')
  }

  const students = await getCurrentStudentRoster()
  if (students.length === 0) throw new Error('ไม่พบรายชื่อนักเรียนปัจจุบัน')
  if (students.some((student) => student.academic_year !== academicYear)) {
    throw new Error('ปีการศึกษาไม่ตรงกับรายชื่อปัจจุบัน')
  }

  const calendarYear = Number(academicYear) - 543
  const dateFrom = `${calendarYear}-05-01`
  const dateTo = `${calendarYear + 1}-04-30`
  const [historyXlsx, historyPdf, statisticsXlsx, statisticsPdf] = await Promise.all([
    createHistoryExampleWorkbook(dateFrom, dateTo),
    createHistoryExamplePdf(dateFrom, dateTo),
    createIllnessStatisticsWorkbook(academicYear),
    createIllnessStatisticsPdf(academicYear),
  ])

  const backupId = `${Date.now()}-${crypto.randomUUID()}`
  const paths = {
    historyXlsx: `${academicYear}/${backupId}-service-history.xlsx`,
    historyPdf: `${academicYear}/${backupId}-service-history.pdf`,
    statisticsXlsx: `${academicYear}/${backupId}-illness-statistics.xlsx`,
    statisticsPdf: `${academicYear}/${backupId}-illness-statistics.pdf`,
  }
  const files = [
    { path: paths.historyXlsx, blob: historyXlsx, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { path: paths.historyPdf, blob: historyPdf, contentType: 'application/pdf' },
    { path: paths.statisticsXlsx, blob: statisticsXlsx, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { path: paths.statisticsPdf, blob: statisticsPdf, contentType: 'application/pdf' },
  ]
  const uploadedPaths: string[] = []

  try {
    for (const file of files) {
      const { error } = await supabase.storage.from(ARCHIVE_BUCKET).upload(file.path, file.blob, {
        contentType: file.contentType,
        upsert: false,
      })
      if (error) throw new Error('อัปโหลดไฟล์สำรองไม่ครบ กรุณาลองใหม่')
      uploadedPaths.push(file.path)
    }
  } catch (cause) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(ARCHIVE_BUCKET).remove(uploadedPaths)
    }
    throw cause instanceof Error ? cause : new Error('สำรองข้อมูลหรือ archive รายชื่อไม่สำเร็จ')
  }

  const { data, error } = await supabase.rpc('archive_active_student_roster', {
    p_academic_year: academicYear,
    p_history_xlsx_path: paths.historyXlsx,
    p_history_pdf_path: paths.historyPdf,
    p_statistics_xlsx_path: paths.statisticsXlsx,
    p_statistics_pdf_path: paths.statisticsPdf,
  })
  if (error) throw new Error('ไฟล์สำรองอยู่ในคลังแล้ว แต่ archive รายชื่อไม่สำเร็จ กรุณาตรวจสอบแล้วลองใหม่')
  return Number(data)
}

export async function getAnnualReportArchives(): Promise<AnnualReportArchive[]> {
  if (!supabase || !isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('annual_report_archives')
    .select('id, academic_year, history_xlsx_path, history_pdf_path, statistics_xlsx_path, statistics_pdf_path, created_at')
    .order('created_at', { ascending: false })
  if (error) throw new Error('โหลดรายการไฟล์สำรองไม่สำเร็จ')
  return data ?? []
}

export async function downloadAnnualArchive(path: string, fileName: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured) throw new Error('ยังไม่ได้เชื่อมต่อ Supabase')
  const { data, error } = await supabase.storage.from(ARCHIVE_BUCKET).createSignedUrl(path, 60)
  if (error || !data.signedUrl) throw new Error('สร้างลิงก์ดาวน์โหลดไฟล์สำรองไม่สำเร็จ')
  const response = await fetch(data.signedUrl)
  if (!response.ok) throw new Error('ดาวน์โหลดไฟล์สำรองไม่สำเร็จ')
  const blobUrl = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  link.click()
  URL.revokeObjectURL(blobUrl)
}
