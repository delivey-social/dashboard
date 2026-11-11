import { useDashboardData } from '#/hooks/use-dashboard-data'
import { ChevronIcon } from './icons'

export default function UserGreeting() {
  const { restaurantsQuery, ordersQuery } = useDashboardData()
  const date = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="mb-2 text-sm font-medium text-[#ff6048]">
          {date.charAt(0).toUpperCase() + date.slice(1)}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Bom dia, Thiago
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Veja o que está acontecendo na sua rede de alimentação.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300">
          Últimos 7 dias <ChevronIcon />
        </button>
        <button
          onClick={() => {
            void restaurantsQuery.refetch()
            void ordersQuery.refetch()
          }}
          className="rounded-xl bg-[#ff6048] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-[#e9513b]"
        >
          Atualizar dados
        </button>
      </div>
    </div>
  )
}
