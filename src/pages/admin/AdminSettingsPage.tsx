import { AdminLayout } from '../../components/layout/AdminLayout'

function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ตั้งค่า</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">ตั้งค่าระบบ</h2>
            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span>ออกรายงานอัตโนมัติ</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span>แจ้งเตือนเมื่อมีนักเรียนรายใหม่</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">บัญชีผู้ใช้</h2>
            <div className="space-y-3 text-sm text-slate-600">
              <p className="rounded-xl bg-slate-50 p-3">Username: nurse_admin</p>
              <p className="rounded-xl bg-slate-50 p-3">ชื่อ: นางสาวพรพิมล สุขสวัสดิ์</p>
              <p className="rounded-xl bg-slate-50 p-3">สิทธิ์: Admin</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminSettingsPage
