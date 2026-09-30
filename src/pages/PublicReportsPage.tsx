import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { StudentLayout } from '../components/layout/StudentLayout'
import { getLocalDateKey } from '../lib/dateUtils'
import { getPublicReportPage, getPublicReportsEnabled, type PublicReportPage, type PublicReportRecord } from '../services/publicReportService'
import { noteOptions, symptomOptions } from '../data/mockData'

const pageSizes = [10, 25, 50, 100]
const emptyPage: PublicReportPage = { records: [], total: 0 }
const symptomCodes = new Set(symptomOptions.map((item) => item.id))
const noteLabels = new Map(noteOptions.map((item) => [item.id, item.label]))

function formatItem(code: string, label: string, detail: string | null): string {
  if (code === 'other' && detail) return detail
  const displayLabel = noteLabels.get(code) ?? label
  return detail ? `${displayLabel}: ${detail}` : displayLabel
}

function ReportRows({ records }: { records: PublicReportRecord[] }) {
  return <>
    {records.map((record, index) => {
      const symptoms = record.items.filter((item) => symptomCodes.has(item.code))
      const notes = record.items.filter((item) => !symptomCodes.has(item.code))

      return (
        <tr key={`${record.service_datetime}-${record.number}-${index}`} className="border-t border-slate-200 align-top">
          <td className="whitespace-nowrap px-4 py-3">
            <div>{new Date(record.service_datetime).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <div className="text-xs text-slate-500">{new Date(record.service_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
          </td>
          <td className="px-4 py-3 font-medium text-slate-800">{record.name} {record.surname}</td>
          <td className="whitespace-nowrap px-4 py-3">{record.class_name || '-'}</td>
          <td className="px-4 py-3">{record.number ?? '-'}</td>
          <td className="min-w-48 px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {symptoms.length > 0 ? symptoms.map((item) => (
                <span key={`${item.code}-${item.detail ?? ''}`} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  {formatItem(item.code, item.label, item.detail)}
                </span>
              )) : <span className="text-slate-400">-</span>}
            </div>
          </td>
          <td className="min-w-36 px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {notes.length > 0 ? notes.map((item) => (
                <span key={`${item.code}-${item.detail ?? ''}`} className="rounded-md bg-sky-50 px-2 py-1 text-xs text-sky-800">
                  {formatItem(item.code, item.label, item.detail)}
                </span>
              )) : <span className="text-slate-400">-</span>}
            </div>
          </td>
        </tr>
      )
    })}
  </>
}

function PublicReportsPage() {
  const navigate = useNavigate()
  const today = getLocalDateKey(new Date())
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [result, setResult] = useState(emptyPage)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const refreshSetting = async () => {
      try {
        const value = await getPublicReportsEnabled()
        if (!active) return
        setEnabled(value)
        if (!value) setResult(emptyPage)
      } catch {
        if (!active) return
        setEnabled(false)
        setResult(emptyPage)
        setError('ตรวจสอบสถานะรายงานไม่สำเร็จ')
      }
    }
    void refreshSetting()
    const interval = window.setInterval(() => void refreshSetting(), 15000)
    return () => { active = false; window.clearInterval(interval) }
  }, [])

  useEffect(() => {
    if (enabled === false) navigate('/nurse', { replace: true })
  }, [enabled, navigate])

  const fromTime = Date.parse(`${dateFrom}T00:00:00Z`)
  const toTime = Date.parse(`${dateTo}T00:00:00Z`)
  const invalidDateRange = !dateFrom || !dateTo || dateFrom > dateTo || Number.isNaN(fromTime) || Number.isNaN(toTime)
  const dateRangeError = dateFrom > dateTo
    ? 'วันที่เริ่มต้นต้องไม่อยู่หลังวันที่สิ้นสุด'
    : 'กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด'

  useEffect(() => {
    if (enabled !== true || invalidDateRange) return
    let active = true
    void getPublicReportPage(dateFrom, dateTo, page, pageSize)
      .then((reportPage) => { if (active) setResult(reportPage) })
      .catch((cause) => {
        if (!active) return
        setResult(emptyPage)
        setError(cause instanceof Error ? cause.message : 'โหลดรายงานไม่สำเร็จ')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [dateFrom, dateTo, enabled, invalidDateRange, page, pageSize])

  const visibleTotal = invalidDateRange ? 0 : result.total
  const pageCount = Math.max(1, Math.ceil(visibleTotal / pageSize))
  const firstRecord = visibleTotal === 0 ? 0 : (page - 1) * pageSize + 1
  const lastRecord = Math.min(page * pageSize, visibleTotal)

  return (
    <StudentLayout>
      <div className="space-y-5 px-4 py-6 sm:px-6 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-sky-700">NURSE REPORT</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">รายงานการใช้บริการเรือนพยาบาล</h2>
            <p className="mt-1 text-sm text-slate-600">แสดงเฉพาะวัน เวลา ชื่อ ห้อง เลขที่ อาการ และหมายเหตุ</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/nurse')}>
            <ArrowLeft size={16} className="mr-2" />
            กลับ
          </Button>
        </div>

        {enabled && invalidDateRange ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{dateRangeError}</p> : null}
        {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

        {enabled ? (
          <>
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-end md:justify-between">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1.5 block">ตั้งแต่วันที่</span>
                  <input aria-label="ตั้งแต่วันที่" type="date" value={dateFrom} onChange={(event) => { setLoading(true); setError(''); setDateFrom(event.target.value); setPage(1) }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1.5 block">ถึงวันที่</span>
                  <input aria-label="ถึงวันที่" type="date" value={dateTo} onChange={(event) => { setLoading(true); setError(''); setDateTo(event.target.value); setPage(1) }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5" />
                </label>
              </div>
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-1.5 block">รายการต่อหน้า</span>
                <select aria-label="รายการต่อหน้า" value={pageSize} onChange={(event) => { setLoading(true); setError(''); setPageSize(Number(event.target.value)); setPage(1) }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  {pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">วันที่ / เวลา</th>
                      <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                      <th className="px-4 py-3">ห้อง</th>
                      <th className="px-4 py-3">เลขที่</th>
                      <th className="px-4 py-3">อาการ</th>
                      <th className="px-4 py-3">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidDateRange ? <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">โปรดแก้ไขช่วงวันที่</td></tr> : null}
                    {!invalidDateRange && loading ? <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">กำลังโหลดรายงาน...</td></tr> : null}
                    {!invalidDateRange && !loading && !error && result.records.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">ไม่พบรายการในช่วงวันที่เลือก</td></tr> : null}
                    {!invalidDateRange && !loading && !error ? <ReportRows records={result.records} /> : null}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">แสดง {firstRecord}-{lastRecord} จาก {visibleTotal} รายการ</p>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Button variant="secondary" aria-label="หน้าก่อนหน้า" title="หน้าก่อนหน้า" disabled={loading || invalidDateRange || page <= 1} onClick={() => { setLoading(true); setError(''); setPage((current) => Math.max(1, current - 1)) }}><ChevronLeft size={18} /></Button>
                  <span className="min-w-24 text-center text-sm text-slate-600">หน้า {page} / {pageCount}</span>
                  <Button variant="secondary" aria-label="หน้าถัดไป" title="หน้าถัดไป" disabled={loading || invalidDateRange || page >= pageCount} onClick={() => { setLoading(true); setError(''); setPage((current) => Math.min(pageCount, current + 1)) }}><ChevronRight size={18} /></Button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </StudentLayout>
  )
}

export default PublicReportsPage