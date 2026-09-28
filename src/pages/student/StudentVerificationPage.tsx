import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { StudentLayout } from '../../components/layout/StudentLayout'
import type { Student } from '../../types'

function StudentVerificationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const student = (location.state as { student?: Student } | null)?.student

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

  return (
    <StudentLayout>
      <div className="space-y-6 px-6 py-8 md:px-10">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-semibold text-blue-700">ข้อมูลนักเรียน</p>
          <p className="mt-1 text-slate-700">กรุณาตรวจสอบข้อมูลก่อนดำเนินการต่อ</p>
        </div>

        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">รหัสนักเรียน</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{student.student_id}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">เลขที่</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{student.number}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">ชื่อ-นามสกุล</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{student.name} {student.surname}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">เพศ</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{student.sex}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">ชั้น</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{student.class_name}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => navigate('/nurse')}>
            <ArrowLeft size={16} className="mr-2" />
            ไม่ถูกต้อง / ค้นหาใหม่
          </Button>
          <Button onClick={() => navigate('/nurse/service', { state: { student } })}>
            <CheckCircle2 size={16} className="mr-2" />
            ข้อมูลถูกต้อง
          </Button>
        </div>
      </div>
    </StudentLayout>
  )
}

export default StudentVerificationPage
