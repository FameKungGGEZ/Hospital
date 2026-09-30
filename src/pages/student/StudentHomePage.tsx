import { Activity, Search, Stethoscope } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { StudentLayout } from '../../components/layout/StudentLayout'
import { lookupStudentById } from '../../services/nurseService'

function StudentHomePage() {
  const navigate = useNavigate()
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const isValidStudentId = studentId.length === 5 && /^\d+$/.test(studentId)

  const helperText = useMemo(() => {
    if (!studentId) return 'กรุณากรอกรหัสประจำตัวนักเรียน 5 หลัก'
    if (studentId.length < 5) return `กรอกอีก ${5 - studentId.length} หลัก`
    return 'พร้อมค้นหาข้อมูล'
  }, [studentId])

  const handleChange = (value: string) => {
    const next = value.replace(/\D/g, '').slice(0, 5)
    setStudentId(next)
    setError('')
  }

  const handleSearch = async () => {
    if (!isValidStudentId) {
      setError('กรุณากรอกรหัสนักเรียน 5 หลักให้ครบถ้วน')
      return
    }

    setIsSearching(true)
    try {
      const student = await lookupStudentById(studentId)
      if (!student) {
        setError('ไม่พบข้อมูลนักเรียนในระบบ กรุณาตรวจสอบรหัสนักเรียนอีกครั้ง')
        return
      }
      navigate('/nurse/verify', { state: { student } })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ค้นหาข้อมูลไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <StudentLayout headerAction={
      <Button
        variant="secondary"
        aria-label="รายงานล่าสุด"
        title="รายงานล่าสุด"
        className="shrink-0 border border-sky-200 px-2.5 sm:px-3"
        onClick={() => navigate('/nurse/reports')}
      >
        <Activity size={16} className="sm:mr-2" />
        <span className="hidden sm:inline">รายงานล่าสุด</span>
      </Button>
    }>
      <div className="space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 sm:p-7 lg:p-8">
          <div className="mx-auto w-full max-w-5xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
              <Stethoscope size={14} />
              Student Service
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                ระบบบันทึกการใช้บริการเรือนพยาบาล
              </h2>
            </div>

            <div className="rounded-[24px] border border-sky-200 bg-white p-3 sm:p-4">
              <div className="block text-left text-sm font-medium text-slate-700">
                <span className="mb-2 block">กรุณากรอกรหัสประจำตัวนักเรียน 5 หลัก</span>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <Input
                      value={studentId}
                      onChange={(event) => handleChange(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && isValidStudentId) {
                          void handleSearch()
                        }
                      }}
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="Student ID"
                      aria-label="Student ID"
                      error={error}
                      className="h-14 rounded-2xl border-sky-200 bg-sky-50/40 text-base font-medium shadow-none focus:border-sky-500 focus:ring-sky-100"
                    />
                  </div>
                  <Button
                    className="h-14 w-full rounded-2xl px-5 text-base shadow-sm sm:w-auto sm:min-w-[170px]"
                    disabled={!isValidStudentId || isSearching}
                    onClick={() => void handleSearch()}
                  >
                    <Search size={18} className="mr-2" />
                    {isSearching ? 'กำลังค้นหา...' : 'ค้นหาข้อมูล'}
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span className="min-w-0 break-words">{helperText}</span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">{studentId.length}/5</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </StudentLayout>
  )
}

export default StudentHomePage
