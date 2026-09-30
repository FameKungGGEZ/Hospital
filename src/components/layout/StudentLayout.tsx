import type { ReactNode } from 'react'

export function StudentLayout({ children, headerAction }: { children: ReactNode; headerAction?: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.72),transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(167,243,208,0.55),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#edf6ff_100%)] text-slate-800">
      <header className="border-b border-sky-100 bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex w-[95vw] max-w-[1500px] flex-col items-start justify-between gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 shadow-sm shadow-sky-100/70">
              <img src="/school-logo.png" alt="ตราโรงเรียนตะพานหิน" className="h-9 w-9 shrink-0 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-700">โรงเรียนตะพานหิน</p>
              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">ระบบบันทึกการใช้บริการเรือนพยาบาล</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {headerAction ?? (
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                School Nurse
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-[95vw] max-w-[1500px] px-0 py-6 sm:py-8 lg:py-10">
        <div className="relative overflow-hidden rounded-[30px] border border-sky-100 bg-white/80 shadow-[0_28px_70px_-35px_rgba(14,116,144,0.45)] backdrop-blur-sm">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),transparent_18%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.10),transparent_20%)]" />
          <div className="relative">{children}</div>
        </div>
      </main>
    </div>
  )
}
