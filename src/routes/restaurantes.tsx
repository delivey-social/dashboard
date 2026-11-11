import { createFileRoute, Link } from '@tanstack/react-router'
import { StoreIcon } from '#/components/dashboard/icons'
import { EmptyState, ErrorBanner } from '#/components/dashboard/content'
import { DashboardHeader, Sidebar } from '#/components/dashboard/layout'
import { useDashboardData } from '#/hooks/use-dashboard-data'

export const Route = createFileRoute('/restaurantes')({
  component: RestaurantsPage,
})

function RestaurantsPage() {
  const { restaurants, restaurantsQuery, error } = useDashboardData()

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <Sidebar />

      <main className="min-h-screen lg:pl-64">
        <DashboardHeader />

        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9">
          <div className="mb-6">
            <p className="text-sm font-medium text-[#e9513b]">Parceiros</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Restaurantes
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Lista de restaurantes cadastrados na sua rede.
            </p>
          </div>

          {error && <ErrorBanner message={getErrorMessage(error)} />}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="font-semibold">Restaurantes cadastrados</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {restaurantsQuery.isLoading
                    ? 'Carregando restaurantes...'
                    : `${restaurants.length} restaurante${restaurants.length === 1 ? '' : 's'} registrado${restaurants.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <Link
                to="/restaurates/manter"
                className="rounded-xl bg-[#ff6048] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#e9513b]"
              >
                Novo restaurante
              </Link>
            </div>

            {restaurantsQuery.isLoading ? (
              <div className="space-y-3 p-5 sm:p-6">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : restaurants.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                  >
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#fff0ec] font-semibold text-[#e9513b]">
                      {restaurant.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {restaurant.name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {restaurant.subtitle}
                      </p>
                    </div>
                    <span className="size-2 rounded-full bg-emerald-400" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<StoreIcon />}
                title="Ainda não há restaurantes"
                message="Os restaurantes cadastrados aparecerão aqui."
              />
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar os restaurantes.'
}
