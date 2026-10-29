import type { ReactNode } from 'react'

type Accent = 'orange' | 'blue' | 'green' | 'purple'

export function MetricCard({
  label,
  value,
  detail,
  icon,
  accent,
}: {
  label: string
  value: string
  detail: string
  icon: ReactNode
  accent: Accent
}) {
  const colors: Record<Accent, string> = {
    orange: 'bg-orange-50 text-orange-500',
    blue: 'bg-blue-50 text-blue-500',
    green: 'bg-emerald-50 text-emerald-500',
    purple: 'bg-violet-50 text-violet-500',
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div
          className={`grid size-9 place-items-center rounded-xl ${colors[accent]}`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  )
}
