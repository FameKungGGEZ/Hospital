import { CheckCircle2, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { StudentLayout } from '../../components/layout/StudentLayout'
import { Button } from '../../components/ui/Button'

function SuccessPage() {
  const navigate = useNavigate()

  return (
    <StudentLayout>
      <div className="px-4 py-8 text-center sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-2xl rounded-[30px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-200/70">
            <CheckCircle2 size={42} />
          </div>

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Completed</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">บันทึกการรับบริการสำเร็จ</h2>
          <p className="mt-3 text-base text-slate-600">ระบบได้บันทึกวันที่และเวลาเรียบร้อยแล้ว พร้อมสำหรับการติดตามและรายงานต่อไป</p>

          <div className="mt-8 flex justify-center">
            <Button className="rounded-2xl px-6" onClick={() => navigate('/nurse')}>
              <Home size={16} className="mr-2" />
              กลับสู่หน้าหลัก
            </Button>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}

export default SuccessPage
