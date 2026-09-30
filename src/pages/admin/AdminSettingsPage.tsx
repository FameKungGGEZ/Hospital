import { useEffect, useState, type FormEvent } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { changeStaffPassword, getActiveStaffProfile, type StaffProfile } from '../../services/authService'
import { getAnnualReportArchives, createAnnualBackupAndArchive, downloadAnnualArchive, type AnnualReportArchive } from '../../services/annualArchiveService'
import { getPublicReportsEnabled, setPublicReportsEnabled } from '../../services/publicReportService'
import { getCurrentStudentRoster } from '../../services/studentRepository'

function AdminSettingsPage() {
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [publicReportsEnabled, setPublicReportsEnabledState] = useState(false)
  const [reportToggleBusy, setReportToggleBusy] = useState(false)
  const [reportToggleError, setReportToggleError] = useState('')
  const [activeAcademicYear, setActiveAcademicYear] = useState(String(new Date().getFullYear() + 543))
  const [activeStudentCount, setActiveStudentCount] = useState(0)
  const [archives, setArchives] = useState<AnnualReportArchive[]>([])
  const [archiveBusy, setArchiveBusy] = useState(false)
  const [archiveError, setArchiveError] = useState('')
  const [archiveMessage, setArchiveMessage] = useState('')

  useEffect(() => {
    let active = true
    void getActiveStaffProfile()
      .then(async (currentProfile) => {
        if (!active) return
        setProfile(currentProfile)
        if (currentProfile?.role !== 'admin') return

        const [reportStatus, roster, savedArchives] = await Promise.allSettled([
          getPublicReportsEnabled(),
          getCurrentStudentRoster(),
          getAnnualReportArchives(),
        ])
        if (!active) return
        if (reportStatus.status === 'fulfilled') setPublicReportsEnabledState(reportStatus.value)
        else setReportToggleError('โหลดสถานะรายงานสาธารณะไม่สำเร็จ')
        if (roster.status === 'fulfilled') {
          setActiveStudentCount(roster.value.length)
          if (roster.value[0]) setActiveAcademicYear(roster.value[0].academic_year)
        } else setArchiveError('โหลดรายชื่อนักเรียนปัจจุบันไม่สำเร็จ')
        if (savedArchives.status === 'fulfilled') setArchives(savedArchives.value)
        else setArchiveError('โหลดไฟล์สำรองไม่สำเร็จ')
      })
      .catch(() => { if (active) setError('โหลดข้อมูลบัญชีไม่สำเร็จ') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')

    if (newPassword.length < 8) {
      setPasswordError('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน')
      return
    }
    if (currentPassword === newPassword) {
      setPasswordError('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน')
      return
    }

    setPasswordBusy(true)
    try {
      await changeStaffPassword(currentPassword, newPassword)
      setPasswordMessage('เปลี่ยนรหัสผ่านแล้ว')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (cause) {
      setPasswordError(cause instanceof Error ? cause.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ')
    } finally {
      setPasswordBusy(false)
    }
  }

  async function handleReportToggle(enabled: boolean) {
    setReportToggleBusy(true)
    setReportToggleError('')
    try {
      await setPublicReportsEnabled(enabled)
      setPublicReportsEnabledState(enabled)
    } catch (cause) {
      setReportToggleError(cause instanceof Error ? cause.message : 'บันทึกการตั้งค่าไม่สำเร็จ')
    } finally {
      setReportToggleBusy(false)
    }
  }

  async function handleAnnualArchive() {
    if (!window.confirm(`ระบบจะสร้างไฟล์สำรองประวัติและสถิติปี ${activeAcademicYear} ก่อน archive รายชื่อปัจจุบัน โดยประวัติบริการเดิมจะยังเก็บไว้ ดำเนินการต่อหรือไม่?`)) return
    setArchiveBusy(true)
    setArchiveError('')
    setArchiveMessage('')
    try {
      const archivedCount = await createAnnualBackupAndArchive(activeAcademicYear)
      setArchiveMessage(`สำรองข้อมูลครบและ archive รายชื่อแล้ว ${archivedCount} คน`)
      setActiveStudentCount(0)
      setArchives(await getAnnualReportArchives())
    } catch (cause) {
      setArchiveError(cause instanceof Error ? cause.message : 'สำรองข้อมูลไม่สำเร็จ')
    } finally {
      setArchiveBusy(false)
    }
  }

  async function handleArchiveDownload(path: string, fileName: string) {
    try {
      await downloadAnnualArchive(path, fileName)
    } catch (cause) {
      setArchiveError(cause instanceof Error ? cause.message : 'ดาวน์โหลดไฟล์สำรองไม่สำเร็จ')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ตั้งค่า</h1>
        </div>

        <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-900">บัญชีผู้ใช้</h2>
            {loading ? <p className="text-sm text-slate-500">กำลังโหลดข้อมูลบัญชี...</p> : null}
            {error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : null}
            {!loading && !error && !profile ? <p className="text-sm text-slate-500">ไม่พบข้อมูลบัญชีที่ใช้งาน</p> : null}
            {profile ? (
              <dl className="space-y-3 text-sm text-slate-600">
                <div className="rounded-lg bg-slate-50 p-3"><dt className="font-medium">ชื่อผู้ใช้</dt><dd>{profile.username}</dd></div>
                <div className="rounded-lg bg-slate-50 p-3"><dt className="font-medium">ชื่อ</dt><dd>{profile.display_name}</dd></div>
                <div className="rounded-lg bg-slate-50 p-3"><dt className="font-medium">สิทธิ์</dt><dd>{profile.role === 'admin' ? 'Admin' : 'Staff'}</dd></div>
              </dl>
            ) : null}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-900">เปลี่ยนรหัสผ่าน</h2>
            <form className="space-y-4" onSubmit={(event) => void handlePasswordChange(event)}>
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-1.5 block">รหัสผ่านปัจจุบัน</span>
                <input required autoComplete="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-1.5 block">รหัสผ่านใหม่</span>
                <input required minLength={8} autoComplete="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-1.5 block">ยืนยันรหัสผ่านใหม่</span>
                <input required minLength={8} autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5" />
              </label>
              {passwordError ? <p role="alert" className="text-sm text-rose-700">{passwordError}</p> : null}
              {passwordMessage ? <p role="status" className="text-sm text-emerald-700">{passwordMessage}</p> : null}
              <Button type="submit" disabled={passwordBusy || !profile}>
                {passwordBusy ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'บันทึกรหัสผ่านใหม่'}
              </Button>
            </form>
          </section>
        </div>

        {profile?.role === 'admin' ? (
          <>
            <section className="max-w-4xl rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900">รายงานที่ครูเข้าดูได้</h2>
              <label className="mt-4 flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <span>{publicReportsEnabled ? 'เปิดรายงานสาธารณะ' : 'ปิดรายงานสาธารณะ'}</span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="เปิดรายงานสาธารณะ"
                  checked={publicReportsEnabled}
                  disabled={reportToggleBusy}
                  onChange={(event) => void handleReportToggle(event.target.checked)}
                  className="h-5 w-5 accent-sky-600"
                />
              </label>
              <p className="mt-2 text-xs text-slate-500">เมื่อปิด ปุ่มหน้า /nurse จะหายและ API จะไม่ส่งข้อมูลรายงาน</p>
              {reportToggleError ? <p role="alert" className="mt-3 text-sm text-rose-700">{reportToggleError}</p> : null}
            </section>

            <section className="max-w-4xl space-y-4 rounded-xl border border-rose-200 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">สำรองข้อมูลและเริ่มปีการศึกษาใหม่</h2>
                <p className="mt-1 text-sm text-slate-600">
                  ปีการศึกษาปัจจุบัน {activeAcademicYear} · นักเรียนที่ยังใช้งาน {activeStudentCount} คน
                </p>
                <p className="mt-1 text-sm text-slate-600">ระบบจะเก็บประวัติบริการและสถิติเป็น XLSX/PDF ก่อน archive รายชื่อเดิม ประวัติบริการจะไม่ถูกลบ</p>
              </div>
              <Button variant="danger" disabled={archiveBusy || activeStudentCount === 0} onClick={() => void handleAnnualArchive()}>
                {archiveBusy ? 'กำลังสำรองข้อมูล...' : 'สำรองและ archive รายชื่อปัจจุบัน'}
              </Button>
              {archiveMessage ? <p role="status" className="text-sm text-emerald-700">{archiveMessage}</p> : null}
              {archiveError ? <p role="alert" className="text-sm text-rose-700">{archiveError}</p> : null}

              {archives.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50"><tr><th className="px-3 py-2">ปีการศึกษา</th><th className="px-3 py-2">วันที่สำรอง</th><th className="px-3 py-2">ไฟล์</th></tr></thead>
                    <tbody>
                      {archives.map((archive) => (
                        <tr key={archive.id} className="border-t border-slate-200 align-top">
                          <td className="px-3 py-3">{archive.academic_year}</td>
                          <td className="whitespace-nowrap px-3 py-3">{new Date(archive.created_at).toLocaleDateString('th-TH')}</td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button variant="secondary" onClick={() => void handleArchiveDownload(archive.history_xlsx_path, `ประวัติบริการ-${archive.academic_year}.xlsx`)}>ประวัติ XLSX</Button>
                              <Button variant="secondary" onClick={() => void handleArchiveDownload(archive.history_pdf_path, `ประวัติบริการ-${archive.academic_year}.pdf`)}>ประวัติ PDF</Button>
                              <Button variant="secondary" onClick={() => void handleArchiveDownload(archive.statistics_xlsx_path, `สถิติการเจ็บป่วย-${archive.academic_year}.xlsx`)}>สถิติ XLSX</Button>
                              <Button variant="secondary" onClick={() => void handleArchiveDownload(archive.statistics_pdf_path, `สถิติการเจ็บป่วย-${archive.academic_year}.pdf`)}>สถิติ PDF</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </AdminLayout>
  )
}

export default AdminSettingsPage
