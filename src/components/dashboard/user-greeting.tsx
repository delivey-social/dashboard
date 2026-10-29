import { useDashboardData } from '#/hooks/use-dashboard-data'
import { ChevronIcon } from './icons'

export default function UserGreeting() {
  const { restaurantsQuery, ordersQuery } = useDashboardData()

  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="mb-2 text-sm font-medium text-[#ff6048]">
          Thursday, October 29
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Good morning, Thiago
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Here&apos;s what&apos;s happening across your food network.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300">
          Last 7 days <ChevronIcon />
        </button>
        <button
          onClick={() => {
            void restaurantsQuery.refetch()
            void ordersQuery.refetch()
          }}
          className="rounded-xl bg-[#ff6048] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-[#e9513b]"
        >
          Refresh data
        </button>
      </div>
    </div>
  )
}
