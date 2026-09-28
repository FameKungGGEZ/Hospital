import { useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { downloadStudentTemplate } from '../../services/fileExportService'
import { commitStudentRoster, previewStudentImport } from '../../services/studentImportService'
import type { StudentImportRow } from '../../services/studentImportService'

const steps = ['Upload XLSX', 'ตรวจสอบ Column', 'ตรวจข้อมูลซ้ำ', 'Preview', 'Confirm Import']
const MAX_FILE_SIZE = 10 * 1024 * 1024

const statusLabels = {
  new: 'ข้อมูลใหม่',
  same: 'เหมือนข้อมูลเดิม',
  changed: 'ข้อมูลเปลี่ยน',
  invalid: 'ข้อมูลผิดพลาด',
} satisfies Record<StudentImportRow['status'], string>

function AdminImportPage() {
  const [step, setStep] = useState(0)
  const [academicYear, setAcademicYear] = useState('2569')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<StudentImportRow[]>([])
  const [error, setError] = useState('')
  const [importedCount, setImportedCount] = useState(0)
  const [studentCount, setStudentCount] = useState(0)
  const [isReading, setIsReading] = useState(false)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const counts = rows.reduce(
    (total, row) => ({ ...total, [row.status]: total[row.status] + 1 }),
    { new: 0, same: 0, changed: 0, invalid: 0 },
  )

  async function handleFile(file?: File) {
    if (!file) return
    setError('')

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('เลือกไฟล์ Excel นามสกุล .xlsx')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('ไฟล์ต้องมีขนาดไม่เกิน 10 MB')
      return
    }

    setIsReading(true)
    try {
      const preview = await previewStudentImport(file, academicYear)
      setRows(preview)
      setFileName(file.name)
      setStep(1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบไฟล์แล้วลองใหม่')
    } finally {
      setIsReading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function changeAction(rowNumber: number, action: 'update' | 'keep') {
    setRows((currentRows) => currentRows.map((row) =>
      row.rowNumber === rowNumber ? { ...row, action } : row,
    ))
  }

  async function confirmImport() {
    try {
      const result = await commitStudentRoster(rows)
      setImportedCount(result.newStudentCount)
      setStudentCount(result.studentCount)
      setError('')
      setStep(4)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'นำเข้ารายชื่อไม่สำเร็จ กรุณาลองใหม่')
    }
  }

  function resetImport() {
    setStep(0)
    setRows([])
    setFileName('')
    setError('')
  }

  async function downloadTemplate() {
    setIsDownloadingTemplate(true)
    setError('')
    try {
      await downloadStudentTemplate(academicYear)
    } catch {
      setError('สร้างไฟล์แม่แบบไม่สำเร็จ')
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import</h1>
          <p className="mt-1 text-sm text-amber-700">โหมดทดสอบ: ข้อมูลจะเก็บในเบราว์เซอร์นี้ ยังไม่ซิงก์กับฐานข้อมูลกลาง</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6 flex flex-wrap gap-2">
            {steps.map((label, index) => (
              <div
                key={label}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  index <= step ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {index + 1}. {label}
              </div>
            ))}
          </div>

          {step === 0 ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-2 block">ปีสำรองเมื่อไม่มีปีในไฟล์</span>
                  <input
                    value={academicYear}
                    onChange={(event) => setAcademicYear(event.target.value)}
                    inputMode="numeric"
                    maxLength={4}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                  />
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  ใช้คอลัมน์ Number → Student_ID → Sex → Name → Surname → Class; อ่านปีจากข้อความด้านบน และรองรับเพศ ช./ญ.
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <FileSpreadsheet className="mx-auto text-emerald-700" size={32} />
                <p className="mt-3 text-lg font-semibold text-slate-700">เลือกไฟล์รายชื่อนักเรียน</p>
                <p className="mt-2 text-sm text-slate-500">รองรับ .xlsx ขนาดไม่เกิน 10 MB</p>
                <div className="mt-5 flex justify-center">
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button disabled={isReading} onClick={() => fileInputRef.current?.click()}>
                      <Upload size={16} className="mr-2" />
                      {isReading ? 'กำลังอ่านไฟล์...' : 'เลือกไฟล์'}
                    </Button>
                    <Button variant="secondary" disabled={isDownloadingTemplate} onClick={() => void downloadTemplate()}>
                      {isDownloadingTemplate ? 'กำลังสร้างแม่แบบ...' : 'ดาวน์โหลดแม่แบบ'}
                    </Button>
                  </div>
                </div>
              </div>
              {error ? <ErrorMessage message={error} /> : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                <CheckCircle2 size={20} />
                <div>
                  <h3 className="font-bold">อ่านไฟล์สำเร็จ</h3>
                  <p className="text-sm">{fileName} · {rows.length} แถว · ตรวจพบคอลัมน์ที่จำเป็นครบ</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <CountTile label="ข้อมูลใหม่" value={counts.new} />
                <CountTile label="ข้อมูลเหมือนเดิม" value={counts.same} />
                <CountTile label="ข้อมูลเปลี่ยน" value={counts.changed} />
                <CountTile label="ข้อมูลผิดพลาด" value={counts.invalid} />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setStep(0)}>ย้อนกลับ</Button>
                <Button onClick={() => setStep(2)}>ต่อไป</Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">ตรวจข้อมูลซ้ำและความถูกต้อง</h3>
                <p className="mt-1 text-sm text-slate-500">ข้อมูลที่เปลี่ยนเลือกได้ว่าจะใช้ข้อมูลใหม่หรือเก็บข้อมูลเดิม ต้องแก้แถวผิดพลาดก่อนจึงยืนยันได้</p>
              </div>
              <div className="max-h-[28rem] overflow-auto rounded-2xl border border-slate-200">
                <table className="min-w-[1250px] text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3">แถว</th>
                      <th className="px-4 py-3">Number</th>
                      <th className="px-4 py-3">Student_ID</th>
                      <th className="px-4 py-3">Sex</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Surname</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Academic_Year</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">รายละเอียด / การตัดสินใจ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowNumber} className="border-t border-slate-200 align-top">
                        <td className="px-4 py-3">{row.rowNumber}</td>
                        <td className="px-4 py-3">{row.student?.number ?? '-'}</td>
                        <td className="px-4 py-3">{row.student?.student_id ?? '-'}</td>
                        <td className="px-4 py-3">{row.student?.sex ?? '-'}</td>
                        <td className="px-4 py-3">{row.student?.name ?? '-'}</td>
                        <td className="px-4 py-3">{row.student?.surname ?? '-'}</td>
                        <td className="px-4 py-3">{row.student?.class_name ?? '-'}</td>
                        <td className="px-4 py-3">{row.student?.academic_year ?? '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                            row.status === 'new' ? 'bg-emerald-100 text-emerald-700' :
                              row.status === 'same' ? 'bg-slate-100 text-slate-700' :
                                row.status === 'changed' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {statusLabels[row.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {row.status === 'changed' ? (
                            <label className="flex items-center gap-2">
                              <span className="sr-only">เลือกการจัดการข้อมูลที่เปลี่ยน</span>
                              <select
                                value={row.action}
                                onChange={(event) => changeAction(row.rowNumber, event.target.value as 'update' | 'keep')}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5"
                              >
                                <option value="keep">เก็บข้อมูลเดิม</option>
                                <option value="update">ใช้ข้อมูลใหม่</option>
                              </select>
                              <span className="text-xs text-slate-500">เปลี่ยน: {row.details.join(', ')}</span>
                            </label>
                          ) : row.details.length > 0 ? (
                            <span className="text-rose-700">{row.details.join(' · ')}</span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setStep(1)}>ย้อนกลับ</Button>
                <Button onClick={() => setStep(3)}>ต่อไป</Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Preview</h3>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-600">ไฟล์: {fileName}</p>
                <p className="mt-2 text-sm text-slate-600">เพิ่มข้อมูลใหม่: {counts.new} รายการ</p>
                <p className="mt-2 text-sm text-slate-600">อัปเดตข้อมูลเดิม: {rows.filter((row) => row.status === 'changed' && row.action === 'update').length} รายการ</p>
                <p className="mt-2 text-sm text-slate-600">เก็บข้อมูลเดิม/แถวผิดพลาด: {counts.same + rows.filter((row) => row.status === 'changed' && row.action === 'keep').length} รายการซ้ำ, {counts.invalid} แถวผิดพลาด</p>
              </div>
              {error ? <ErrorMessage message={error} /> : null}
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setStep(2)}>ย้อนกลับ</Button>
                <Button disabled={counts.invalid > 0} onClick={() => void confirmImport()}>ยืนยันนำเข้า</Button>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Confirm Import</h3>
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                เพิ่มนักเรียนใหม่ {importedCount} คน · roster ปีการศึกษานี้ทั้งหมด {studentCount} คน
              </div>
              <div className="flex justify-end gap-3">
                <Button onClick={resetImport}>นำเข้าไฟล์อื่น</Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AdminLayout>
  )
}

function CountTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export default AdminImportPage
