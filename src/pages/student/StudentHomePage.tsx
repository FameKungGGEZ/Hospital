import { Search } from 'lucide-react'
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
    <StudentLayout>
      <div className="space-y-8 px-6 py-10 md:px-10">
        <div className="text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Student Service</p>
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">ระบบบันทึกการใช้บริการเรือนพยาบาล</h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-8">
          <div className="mx-auto max-w-xl space-y-5">
            <label className="block text-left text-sm font-medium text-slate-700">
              <span className="mb-2 block">กรุณากรอกรหัสประจำตัวนักเรียน 5 หลัก</span>
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
              />
            </label>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{helperText}</span>
              <span>{studentId.length}/5</span>
            </div>

            <Button
              className="w-full"
              disabled={!isValidStudentId || isSearching}
              onClick={() => void handleSearch()}
            >
              <Search size={16} className="mr-2" />
              {isSearching ? 'กำลังค้นหา...' : 'ค้นหาข้อมูล'}
            </Button>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}

export default StudentHomePage
