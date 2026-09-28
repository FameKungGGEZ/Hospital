import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { StudentLayout } from '../../components/layout/StudentLayout'
import { Button } from '../../components/ui/Button'
import { createServiceRecord } from '../../services/nurseService'
import { noteOptions, symptomOptions } from '../../data/mockData'
import type { Student } from '../../types'

function ServiceFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const student = (location.state as { student?: Student } | null)?.student
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [otherDetail, setOtherDetail] = useState('')
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const summaryText = useMemo(
    () => `เลือกอาการแล้ว ${selectedSymptoms.length} รายการ
เลือกหมายเหตุแล้ว ${selectedNotes.length} รายการ`,
    [selectedSymptoms.length, selectedNotes.length],
  )

  if (!student) {
    return (
      <StudentLayout>
        <div className="px-6 py-10 text-center text-slate-600 md:px-10">
          <AlertCircle className="mx-auto mb-4 text-red-500" />
          <p>ไม่พบข้อมูลนักเรียน กรุณาค้นหาใหม่อีกครั้ง</p>
          <div className="mt-5">
            <Button onClick={() => navigate('/nurse')}>กลับหน้าหลัก</Button>
          </div>
        </div>
      </StudentLayout>
    )
  }

  const selectedSymptomCount = selectedSymptoms.length
  const selectedNoteCount = selectedNotes.length
  const showOtherInput = selectedNotes.includes('other')
  const allowsSubmit = selectedSymptomCount > 0 && selectedNoteCount > 0 && (!showOtherInput || otherDetail.trim().length > 0)

  const toggleSymptom = (value: string) => {
    setSelectedSymptoms((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
    setServerError('')
  }

  const toggleNote = (value: string) => {
    setSelectedNotes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
    setServerError('')
  }

  const handleSubmit = async () => {
    if (!allowsSubmit) {
      setServerError(showOtherInput && !otherDetail.trim()
        ? 'กรุณากรอกรายละเอียดในช่องอื่นๆ'
        : 'กรุณาเลือกอาการและหมายเหตุอย่างน้อยอย่างละ 1 รายการ')
      return
    }

    const serviceItems = [...selectedSymptoms, ...selectedNotes]
    if (showOtherInput && otherDetail.trim()) {
      serviceItems.push(`other:${otherDetail.trim()}`)
    }

    setIsSubmitting(true)
    try {
      await createServiceRecord(student.student_id, serviceItems)
      navigate('/nurse/success', { state: { student } })
    } catch (cause) {
      setServerError(cause instanceof Error ? cause.message : 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่')
      setIsSubmitting(false)
    }
  }

  return (
    <StudentLayout>
      <div className="space-y-6 px-6 py-8 md:px-10">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-600">นักเรียน: {student.name} {student.surname}</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{student.student_id} · {student.class_name}</p>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="mb-4 text-xl font-bold text-slate-900">อาการเจ็บป่วย / การปฐมพยาบาล</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {symptomOptions.map((symptom) => {
                const checked = selectedSymptoms.includes(symptom.id)
                return (
                  <button
                    key={symptom.id}
                    type="button"
                    onClick={() => toggleSymptom(symptom.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                      checked
                        ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                        : symptom.id === 'wound_care'
                          ? 'border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-300'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                    aria-pressed={checked}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs font-bold ${
                        checked
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white text-slate-400'
                      }`}
                    >
                      {checked ? '✓' : ''}
                    </span>
                    <span className="font-medium">{symptom.label}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-bold text-slate-900">หมายเหตุ</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {noteOptions.map((note) => {
                const checked = selectedNotes.includes(note.id)
                const noteStyle =
                  note.tone === 'rest'
                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                    : note.tone === 'accident'
                      ? 'border-pink-200 bg-pink-50 text-pink-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700'

                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => toggleNote(note.id)}
                    className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                      checked ? `${noteStyle} ring-2 ring-offset-1 ring-slate-200` : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                    aria-pressed={checked}
                  >
                    <span className="font-medium">{note.label}</span>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs font-bold ${
                        checked
                          ? 'border-current bg-transparent text-current'
                          : 'border-slate-300 bg-white text-slate-400'
                      }`}
                    >
                      {checked ? '✓' : ''}
                    </span>
                  </button>
                )
              })}
            </div>

            {showOtherInput ? (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700">
                  <span className="mb-2 block">รายละเอียดอื่นๆ</span>
                  <input
                    value={otherDetail}
                    onChange={(event) => setOtherDetail(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="รายละเอียดอื่นๆ"
                  />
                </label>
              </div>
            ) : null}
          </section>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm leading-6 text-slate-700 whitespace-pre-line">{summaryText}</p>
        </div>

        {serverError ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button className="min-w-52" onClick={() => void handleSubmit()} disabled={!allowsSubmit || isSubmitting}>
            <CheckCircle2 size={16} className="mr-2" />
            {isSubmitting ? 'กำลังบันทึก...' : '✓ ยืนยันการรับบริการ'}
          </Button>
        </div>
      </div>
    </StudentLayout>
  )
}

export default ServiceFormPage
