import { Activity, BarChart3, CalendarDays, ClipboardList, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { noteOptions, symptomOptions } from '../../data/mockData'
import { getCurrentStudentRoster, getServiceHistory, type ServiceHistoryRecord } from '../../services/studentRepository'
import type { Student } from '../../types'

const allOptionLabels = new Map([...symptomOptions, ...noteOptions].map((item) => [item.id, item.label]))

function AdminDashboardPage() {
  const [studentDirectory, setStudentDirectory] = useState<Student[]>([])
  const [serviceRecords, setServiceRecords] = useState<ServiceHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void Promise.all([getCurrentStudentRoster(), getServiceHistory()])
      .then(([students, records]) => {
        if (!active) return
        setStudentDirectory(students)
        setServiceRecords(records)
      })
      .catch(() => { if (active) setError('โหลดข้อมูล Dashboard ไม่สำเร็จ') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const totalToday = serviceRecords.filter((record) => record.service_datetime.slice(0, 10) === today).length
  const totalMonth = serviceRecords.filter((record) => record.service_datetime.slice(0, 7) === today.slice(0, 7)).length
  const male = studentDirectory.filter((student) => student.sex === 'ชาย').length
  const female = studentDirectory.filter((student) => student.sex === 'หญิง').length
  const symptomCounts = new Map<string, number>()

  for (const record of serviceRecords) {
    for (const itemId of record.selected_items) {
      const symptom = symptomOptions.find((option) => option.id === itemId)
      if (symptom) symptomCounts.set(symptom.label, (symptomCounts.get(symptom.label) ?? 0) + 1)
    }
  }

  const frequentSymptoms = [...symptomCounts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((first, second) => second.value - first.value)
    .slice(0, 4)
  const maxSymptomCount = Math.max(1, ...frequentSymptoms.map((item) => item.value))

  const recent = serviceRecords.slice(0, 6).map((record) => {
    const student = record.student ?? studentDirectory.find((item) => item.student_id === record.student_id)
    const labelList = record.selected_items.map((item) => allOptionLabels.get(item) ?? item)

    return {
      ...record,
      student,
      labelList,
    }
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        </div>
        {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<ClipboardList size={18} />} title="จำนวนผู้ใช้บริการวันนี้" value={String(totalToday)} tone="blue" />
          <MetricCard icon={<Users size={18} />} title="จำนวนชาย" value={String(male)} tone="green" />
          <MetricCard icon={<Users size={18} />} title="จำนวนหญิง" value={String(female)} tone="pink" />
          <MetricCard icon={<CalendarDays size={18} />} title="จำนวนผู้ใช้บริการเดือนนี้" value={String(totalMonth)} tone="slate" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">อาการที่พบบ่อย</h2>
              <BarChart3 className="text-slate-400" size={18} />
            </div>
            <div className="space-y-4">
              {frequentSymptoms.length > 0 ? frequentSymptoms.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                    <span>{item.label}</span>
                    <span>{item.value} ครั้ง</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100">
                    <div className="h-2.5 rounded-full bg-blue-500" style={{ width: `${(item.value / maxSymptomCount) * 100}%` }} />
                  </div>
                </div>
              )) : <p className="text-sm text-slate-500">ยังไม่มีข้อมูลบริการ</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Live Activity</h2>
              <Activity className="text-red-500" size={18} />
            </div>
            <div className="space-y-3">
              {loading ? <p className="text-sm text-slate-500">กำลังโหลดรายการ...</p> : recent.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มีรายการใช้บริการ</p> : recent.map((record) => (
                <div key={record.id} className="rounded-xl border border-blue-100 bg-white/90 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>{new Date(record.service_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">Live</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-800">{record.student_id}</p>
                    <span className="text-xs text-slate-500">{record.student?.class_name ?? '-'}</span>
                  </div>
                  <p className="text-sm text-slate-600">{record.student ? `${record.student.name} ${record.student.surname}` : 'ไม่ทราบชื่อ'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {record.labelList.map((label) => {
                      const isNote = ['นอนพัก', 'กลับบ้าน', 'อุบัติเหตุ', 'ส่ง รพ.', 'อื่นๆ'].includes(label)

                      return (
                        <span
                          key={`${record.id}-${label}`}
                          className={`rounded-full border px-2 py-1 text-[11px] font-medium ${
                            isNote
                              ? 'border-blue-200 bg-blue-100 text-blue-800'
                              : 'border-slate-200 bg-slate-100 text-slate-700'
                          }`}
                        >
                          {label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function MetricCard({ icon, title, value, tone }: { icon: ReactNode; title: string; value: string; tone: 'blue' | 'green' | 'pink' | 'slate' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    pink: 'bg-pink-50 text-pink-700',
    slate: 'bg-slate-100 text-slate-700',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

export default AdminDashboardPage
