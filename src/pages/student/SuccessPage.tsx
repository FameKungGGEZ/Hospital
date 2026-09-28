import { CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { StudentLayout } from '../../components/layout/StudentLayout'
import { Button } from '../../components/ui/Button'

function SuccessPage() {
  const navigate = useNavigate()

  return (
    <StudentLayout>
      <div className="px-6 py-14 text-center md:px-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 size={44} />
        </div>

        <h2 className="mt-6 text-3xl font-bold text-slate-900">บันทึกการรับบริการสำเร็จ</h2>
        <p className="mt-3 text-slate-600">ระบบบันทึกวันที่และเวลาเรียบร้อยแล้ว</p>

        <div className="mt-8 flex justify-center">
          <Button onClick={() => navigate('/nurse')}>
            เสร็จสิ้น
          </Button>
        </div>
      </div>
    </StudentLayout>
  )
}

export default SuccessPage
