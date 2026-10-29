import type { ReactNode } from 'react'
import {
  BellIcon,
  GridIcon,
  ReceiptIcon,
  SettingsIcon,
  SparkIcon,
  StoreIcon,
  UsersIcon,
} from './icons'

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
      <div className="flex items-center gap-3 lg:hidden">
        <div className="grid size-9 place-items-center rounded-xl bg-[#ff6048] text-sm font-bold text-white">
          C
        </div>
        <span className="font-semibold">Comida</span>
      </div>
      <div className="hidden text-sm text-slate-500 sm:block">
        Workspace <span className="mx-2 text-slate-300">/</span>{' '}
        <span className="font-medium text-slate-900">Overview</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button
          className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          aria-label="Notifications"
        >
          <BellIcon />
        </button>
        <div className="grid size-9 place-items-center rounded-full bg-[#1d2939] text-xs font-bold text-white">
          TT
        </div>
      </div>
    </header>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-[73px] items-center gap-3 border-b border-slate-100 px-7">
        <div className="grid size-9 place-items-center rounded-xl bg-[#ff6048] text-sm font-bold text-white shadow-sm shadow-orange-200">
          C
        </div>
        <span className="text-lg font-semibold tracking-tight">
          comida<span className="text-[#ff6048]">.</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col px-4 py-6">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </p>
        <nav className="space-y-1">
          <NavItem icon={<GridIcon />} label="Overview" active />
          <NavItem icon={<StoreIcon />} label="Restaurants" />
          <NavItem icon={<ReceiptIcon />} label="Orders" />
        </nav>
        <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Manage
        </p>
        <nav className="space-y-1">
          <NavItem icon={<UsersIcon />} label="Customers" />
          <NavItem icon={<SettingsIcon />} label="Settings" />
        </nav>
        <div className="mt-auto rounded-2xl bg-[#fff3ef] p-4">
          <div className="mb-3 grid size-8 place-items-center rounded-lg bg-white text-[#ff6048]">
            <SparkIcon />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Grow your network
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Invite more restaurants to join Comida.
          </p>
          <button className="mt-3 text-xs font-semibold text-[#e9513b]">
            Invite a restaurant →
          </button>
        </div>
      </div>
      <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400">
        Comida Dashboard
      </div>
    </aside>
  )
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: ReactNode
  label: string
  active?: boolean
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-[#fff0ec] text-[#e9513b]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
    >
      {icon}
      {label}
    </button>
  )
}
