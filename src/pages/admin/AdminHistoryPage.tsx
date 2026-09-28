import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { noteOptions, symptomOptions } from '../../data/mockData'
import { getServiceHistory } from '../../services/studentRepository'
import type { ServiceHistoryRecord } from '../../services/studentRepository'

const symptomLabels = new Map(symptomOptions.map((item) => [item.id, item.label]))
const noteLabels = new Map(noteOptions.map((item) => [item.id, item.label]))

function getSelectedLabels(selectedItems: string[]) {
  const symptoms: string[] = []
  const notes: string[] = []

  for (const selectedItem of selectedItems) {
    const detailSeparator = selectedItem.indexOf(':')
    const itemId = detailSeparator < 0 ? selectedItem : selectedItem.slice(0, detailSeparator)
    const detail = detailSeparator < 0 ? '' : selectedItem.slice(detailSeparator + 1).trim()
    const symptomLabel = symptomLabels.get(itemId)
    const noteLabel = noteLabels.get(itemId)

    if (symptomLabel) symptoms.push(symptomLabel)
    else if (noteLabel) notes.push(detail ? `${noteLabel}: ${detail}` : noteLabel)
    else notes.push(selectedItem)
  }

  return { symptoms, notes }
}

function AdminHistoryPage() {
  const [serviceRecords, setServiceRecords] = useState<ServiceHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void getServiceHistory()
      .then((records) => { if (active) setServiceRecords(records) })
      .catch(() => { if (active) setError('โหลดประวัติการใช้บริการไม่สำเร็จ') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ประวัติการใช้บริการ</h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-5">
            <input className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" type="date" />
            <input className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" type="date" />
            <input className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" placeholder="รหัสนักเรียน" />
            <input className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" placeholder="ชั้น" />
            <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
              <option>เพศ</option>
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
                  <th className="px-4 py-3">วันที่</th>
                  <th className="px-4 py-3">เวลา</th>
                  <th className="px-4 py-3">รหัสนักเรียน</th>
                  <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3">ชั้น</th>
                  <th className="px-4 py-3">อาการ</th>
                  <th className="px-4 py-3">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">กำลังโหลดประวัติ...</td></tr>
                ) : error ? (
                  <tr><td colSpan={7} role="alert" className="px-4 py-10 text-center text-rose-700">{error}</td></tr>
                ) : serviceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">ยังไม่มีประวัติการใช้บริการ</td>
                  </tr>
                ) : serviceRecords.map((record) => {
                  const selectedLabels = getSelectedLabels(record.selected_items)
                  return (
                    <tr key={record.id} className="border-t border-slate-200">
                      <td className="px-4 py-3">{new Date(record.service_datetime).toLocaleDateString('th-TH')}</td>
                      <td className="px-4 py-3">{new Date(record.service_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 font-medium">{record.student_id}</td>
                      <td className="px-4 py-3">{record.student ? `${record.student.name} ${record.student.surname}` : '-'}</td>
                      <td className="px-4 py-3">{record.student?.class_name ?? '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-48 flex-wrap gap-1.5">
                          {selectedLabels.symptoms.length > 0 ? selectedLabels.symptoms.map((label) => (
                            <span key={label} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{label}</span>
                          )) : <span className="text-slate-400">-</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-32 flex-wrap gap-1.5">
                          {selectedLabels.notes.length > 0 ? selectedLabels.notes.map((label) => (
                            <span key={label} className="rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-800">{label}</span>
                          )) : <span className="text-slate-400">-</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminHistoryPage
