import { BarChart3, Download, FileSpreadsheet, History, Import, LogOut, Menu, Settings, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { getActiveStaffProfile, signOutStaff } from '../../services/authService'
import { useEffect } from 'react'

const navItems = [
  { label: 'Dashboard', to: '/nurse/admin/dashboard', icon: BarChart3 },
  { label: 'นักเรียน', to: '/nurse/admin/students', icon: Users },
  { label: 'ประวัติการใช้บริการ', to: '/nurse/admin/history', icon: History },
  { label: 'Import', to: '/nurse/admin/import', icon: Import },
  { label: 'Export', to: '/nurse/admin/export', icon: Download },
  { label: 'Report', to: '/nurse/admin/report', icon: FileSpreadsheet },
  { label: 'ตั้งค่า', to: '/nurse/admin/settings', icon: Settings },
  { label: 'ออกจากระบบ', to: '/nurse', icon: LogOut },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    let cancelled = false
    void getActiveStaffProfile().then((profile) => {
      if (!profile) navigate('/nurse/admin/login', { replace: true })
      if (!cancelled) setAuthReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/nurse/admin/login', { replace: true })
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [navigate])

  if (!authReady) return <div className="p-8 text-sm text-slate-600">กำลังตรวจสอบสิทธิ์...</div>

  const handleNavClick = (label: string, closeMobile = false) => {
    if (label === 'ออกจากระบบ') void signOutStaff()
    if (closeMobile) setMobileOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="hidden min-h-screen w-72 border-r border-slate-200 bg-white p-5 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <img src="/school-logo.png" alt="ตราโรงเรียนตะพานหิน" className="h-12 w-12 shrink-0 object-contain" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">School Nurse</p>
              <h1 className="mt-1 text-xl font-bold text-slate-900">โรงเรียนตะพานหิน</h1>
            </div>
          </div>
          <nav className="space-y-2">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
                onClick={() => handleNavClick(label)}
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <header className="border-b border-slate-200 bg-white px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button type="button" className="rounded-xl border border-slate-200 p-2 lg:hidden" onClick={() => setMobileOpen(true)}>
                  <Menu size={18} />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Nurse System</p>
                  <h2 className="text-lg font-bold text-slate-900">Management Console</h2>
                </div>
              </div>
              <Button variant="secondary" onClick={() => window.location.assign('/nurse')}>Student View</Button>
            </div>
          </header>

          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="h-full w-72 bg-white p-5" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center gap-3">
              <img src="/school-logo.png" alt="ตราโรงเรียนตะพานหิน" className="h-12 w-12 shrink-0 object-contain" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">School Nurse</p>
                <h1 className="mt-1 text-xl font-bold text-slate-900">โรงเรียนตะพานหิน</h1>
              </div>
            </div>
            <nav className="space-y-2">
              {navItems.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={label}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                  onClick={() => handleNavClick(label, true)}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  )
}
