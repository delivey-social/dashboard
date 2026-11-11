import { createFileRoute, Link } from '@tanstack/react-router'
import { StoreIcon } from '#/components/dashboard/icons'
import { EmptyState, ErrorBanner } from '#/components/dashboard/content'
import { DashboardHeader, Sidebar } from '#/components/dashboard/layout'
import { useDashboardData } from '#/hooks/use-dashboard-data'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '#/api'

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
                  <RestaurantListItem
                    key={restaurant.id}
                    restaurant={restaurant}
                  />
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

function RestaurantListItem({
  restaurant,
}: {
  restaurant: { id: string; name: string; subtitle: string }
}) {
  const queryClient = useQueryClient()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const deleteRestaurant = useMutation({
    mutationFn: () =>
      apiClient.request('/restaurante/{restaurante_id}', 'delete', {
        path: { restaurante_id: restaurant.id },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['restaurants'] })
      setIsDeleteModalOpen(false)
    },
  })
  const logoQuery = useQuery({
    queryKey: ['restaurant-logo', restaurant.id],
    queryFn: () =>
      apiClient.request('/restaurante/{restaurante_id}/logo', 'get', {
        path: { restaurante_id: restaurant.id },
      }),
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!logoQuery.data) return
    if (logoQuery.data instanceof Blob) {
      const url = URL.createObjectURL(logoQuery.data)
      setLogoUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    if (typeof logoQuery.data === 'string') setLogoUrl(logoQuery.data)
  }, [logoQuery.data])

  return (
    <>
      <div className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50 sm:px-6">
        <Link
          to="/restaurates/manter/{-$id}"
          params={{ id: restaurant.id }}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#fff0ec] font-semibold text-[#e9513b]">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`Logo de ${restaurant.name}`}
                className="size-full object-cover"
              />
            ) : (
              restaurant.name.slice(0, 1).toUpperCase()
            )}
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
        </Link>
        <button
          type="button"
          aria-label={`Excluir ${restaurant.name}`}
          title="Excluir restaurante"
          onClick={() => setIsDeleteModalOpen(true)}
          className="shrink-0 cursor-pointer rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
        >
          <TrashIcon />
        </button>
      </div>

      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-30 grid place-items-center bg-slate-950/30 px-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsDeleteModalOpen(false)
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-restaurant-${restaurant.id}`}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
          >
            <h3
              id={`delete-restaurant-${restaurant.id}`}
              className="text-lg font-semibold text-slate-900"
            >
              Excluir restaurante?
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              O restaurante <strong>{restaurant.name}</strong> será removido
              permanentemente.
            </p>
            {deleteRestaurant.error && (
              <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                Não foi possível excluir o restaurante.
              </p>
            )}
            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteRestaurant.mutate()}
                disabled={deleteRestaurant.isPending}
                className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteRestaurant.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M4.5 6.5h11M8 3.5h4l.7 3H7.3l.7-3Z" />
      <path
        d="m6 6.5.6 10h6.8l.6-10M8.5 9.5v4.5M11.5 9.5v4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar os restaurantes.'
}
