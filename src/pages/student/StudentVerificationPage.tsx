import { AlertCircle, ArrowLeft, CheckCircle2, IdCard, ShieldCheck } from 'lucide-react'
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
      <div className="space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="rounded-[26px] border border-sky-200 bg-gradient-to-r from-sky-50 to-emerald-50 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">Workflow • Step 2</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">ตรวจสอบข้อมูลนักเรียน</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              <ShieldCheck size={16} />
              พร้อมยืนยันข้อมูล
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <IdCard size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Student Profile</p>
                <h3 className="text-lg font-bold text-slate-900">ข้อมูลนักเรียน</h3>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">รหัสนักเรียน</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{student.student_id}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">เลขที่</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{student.number}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">ชื่อ-นามสกุล</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{student.name} {student.surname}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">เพศ</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{student.sex}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">ชั้น</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{student.class_name}</p>
              </div>
            </div>
          </div>

          <aside className="rounded-[28px] border border-sky-200 bg-sky-50 p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">Checklist</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-3 rounded-2xl bg-white/80 p-3"><span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">✓</span> ข้อมูลนักเรียนถูกต้อง</li>
              <li className="flex items-start gap-3 rounded-2xl bg-white/80 p-3"><span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">✓</span> ประวัติการใช้บริการพร้อมตรวจสอบ</li>
              <li className="flex items-start gap-3 rounded-2xl bg-white/80 p-3"><span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">✓</span> บันทึกผลการให้บริการได้ทันที</li>
            </ul>

            <div className="mt-6 flex flex-col gap-3">
              <Button variant="secondary" onClick={() => navigate('/nurse')}>
                <ArrowLeft size={16} className="mr-2" />
                ไม่ถูกต้อง / ค้นหาใหม่
              </Button>
              <Button onClick={() => navigate('/nurse/service', { state: { student } })}>
                <CheckCircle2 size={16} className="mr-2" />
                ข้อมูลถูกต้อง
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </StudentLayout>
  )
}

export default StudentVerificationPage
