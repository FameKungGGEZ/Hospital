import { Search, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { getCurrentStudentRoster } from '../../services/studentRepository'
import type { Student } from '../../types'

function AdminStudentsPage() {
  const navigate = useNavigate()
  const [studentDirectory, setStudentDirectory] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void getCurrentStudentRoster()
      .then((students) => { if (active) setStudentDirectory(students) })
      .catch(() => { if (active) setError('โหลดรายชื่อนักเรียนไม่สำเร็จ') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">นักเรียน</h1>
          </div>
          <Button onClick={() => navigate('/nurse/admin/import')}>
            <Upload size={16} className="mr-2" />
            Import XLSX
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-3.5 text-slate-400" size={17} />
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Search"
              />
            </div>
            <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option>ทุกชั้น</option>
              <option>ม.4</option>
              <option>ม.5</option>
              <option>ม.6</option>
            </select>
            <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option>ทุกเพศ</option>
              <option>ชาย</option>
              <option>หญิง</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3">เลขที่</th>
                  <th className="px-4 py-3">รหัสนักเรียน</th>
                  <th className="px-4 py-3">ชื่อ</th>
                  <th className="px-4 py-3">นามสกุล</th>
                  <th className="px-4 py-3">เพศ</th>
                  <th className="px-4 py-3">ชั้น</th>
                  <th className="px-4 py-3">ปีการศึกษา</th>
                  <th className="px-4 py-3">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">กำลังโหลดรายชื่อนักเรียน...</td></tr>
                ) : error ? (
                  <tr><td colSpan={8} role="alert" className="px-4 py-10 text-center text-rose-700">{error}</td></tr>
                ) : studentDirectory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">ยังไม่มีรายชื่อนักเรียน</td>
                  </tr>
                ) : studentDirectory.map((student) => (
                  <tr key={student.student_id} className="border-t border-slate-200">
                    <td className="px-4 py-3">{student.number}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{student.student_id}</td>
                    <td className="px-4 py-3">{student.name}</td>
                    <td className="px-4 py-3">{student.surname}</td>
                    <td className="px-4 py-3">{student.sex}</td>
                    <td className="px-4 py-3">{student.class_name}</td>
                    <td className="px-4 py-3">{student.academic_year}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminStudentsPage
