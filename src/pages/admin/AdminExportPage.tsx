import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import {
  downloadHistoryExampleWorkbook,
  downloadIllnessStatisticsWorkbook,
  getIllnessStatistics,
  printHistoryExamplePdf,
  printIllnessStatisticsPdf,
} from '../../services/fileExportService'

function dateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function AdminExportPage() {
  const today = dateInputValue(new Date())
  const [dateFrom, setDateFrom] = useState(() => dateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [dateTo, setDateTo] = useState(today)
  const [academicYear, setAcademicYear] = useState('2569')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [semesters, setSemesters] = useState<Awaited<ReturnType<typeof getIllnessStatistics>>>([])
  const invalidDateRange = Boolean(dateFrom && dateTo && dateFrom > dateTo)

  useEffect(() => {
    let active = true
    void getIllnessStatistics(academicYear)
      .then((reports) => { if (active) setSemesters(reports) })
      .catch(() => { if (active) setError('โหลดข้อมูลสถิติไม่สำเร็จ') })
    return () => { active = false }
  }, [academicYear])

  async function exportServiceXlsx() {
    setBusy(true)
    setError('')
    try {
      await downloadHistoryExampleWorkbook(dateFrom, dateTo)
    } catch {
      setError('สร้างไฟล์ Excel ไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  async function exportReportXlsx() {
    setBusy(true)
    setError('')
    try {
      await downloadIllnessStatisticsWorkbook(academicYear)
    } catch {
      setError('สร้างไฟล์รายงานไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  function exportServicePdf() {
    setError('')
    void printHistoryExamplePdf(dateFrom, dateTo).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : 'สร้าง PDF ไม่สำเร็จ')
    })
  }

  function exportReportPdf() {
    setError('')
    void printIllnessStatisticsPdf(academicYear).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : 'สร้าง PDF ไม่สำเร็จ')
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Export</h1>
          <p className="mt-1 text-sm text-amber-700">โหมดทดสอบ: ส่งออกจากข้อมูลที่บันทึกในเบราว์เซอร์นี้</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-slate-900">ประวัติบริการ</h2>
            <p className="mb-4 text-sm text-slate-500">Excel รวมยอดทุกคน · PDF แบ่งหน้า หน้าละไม่เกิน 10 คน</p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-2 block">วันที่เริ่มต้น</span>
                <input value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} type="date" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-2 block">วันที่สิ้นสุด</span>
                <input value={dateTo} onChange={(event) => setDateTo(event.target.value)} type="date" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
              </label>
            </div>
            <div className="mt-4 flex gap-3">
              <Button disabled={busy || invalidDateRange} onClick={() => void exportServiceXlsx()}>
                {busy ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลด XLSX'}
              </Button>
              <Button variant="secondary" disabled={invalidDateRange} onClick={exportServicePdf}>พิมพ์ / บันทึก PDF</Button>
            </div>
            {invalidDateRange ? <p className="mt-3 text-sm text-rose-700">วันที่เริ่มต้นต้องไม่อยู่หลังวันที่สิ้นสุด</p> : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-slate-900">สถิติการเจ็บป่วย</h2>
            <p className="mb-4 text-sm text-slate-500">Excel มีทั้ง 2 เทอม · PDF แยกเทอมละหน้า</p>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-2 block">ปีการศึกษา</span>
                <select value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <option value="2568">2568</option>
                  <option value="2569">2569</option>
                </select>
              </label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                เทอม 1: พ.ค. – ต.ค.<br />เทอม 2: พ.ย. – มี.ค.
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">เทอม 1: {semesters[0]?.visitTotal ?? 0} ครั้ง · เทอม 2: {semesters[1]?.visitTotal ?? 0} ครั้ง</p>
            <div className="mt-4 flex gap-3">
              <Button onClick={exportReportPdf}>พิมพ์ / บันทึก PDF</Button>
              <Button variant="secondary" disabled={busy} onClick={() => void exportReportXlsx()}>
                {busy ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลด XLSX'}
              </Button>
            </div>
          </div>
        </div>
        {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      </div>
    </AdminLayout>
  )
}

export default AdminExportPage
