import type { ReactNode } from 'react'

export function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <img src="/school-logo.png" alt="ตราโรงเรียนตะพานหิน" className="h-12 w-12 shrink-0 object-contain" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">โรงเรียนตะพานหิน</p>
                <h1 className="text-lg font-bold text-slate-900">ระบบบันทึกการใช้บริการเรือนพยาบาล</h1>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}
