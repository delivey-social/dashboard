import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { apiClient } from '#/api'
import { DashboardHeader, Sidebar } from '#/components/dashboard/layout'

export const Route = createFileRoute('/restaurates/manter/{-$id}')({
  component: RestaurantFormPage,
})

function RestaurantFormPage() {
  const { id } = Route.useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const restaurantQuery = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () =>
      apiClient.request('/restaurante/{restaurante_id}', 'get', {
        path: { restaurante_id: id! },
      }),
    enabled: isEditing,
  })
  const [name, setName] = useState('')
  useEffect(() => {
    if (restaurantQuery.data) {
      const restaurant = asRecord(restaurantQuery.data)
      setName(getString(restaurant, 'nome', 'name') ?? '')
    }
  }, [restaurantQuery.data])
  const createRestaurant = useMutation({
    mutationFn: () =>
      isEditing
        ? apiClient.request('/restaurante/{restaurante_id}', 'put', {
            path: { restaurante_id: id! },
            body: { nome: name.trim() },
          })
        : apiClient.request('/restaurante/', 'post', {
            body: { nome: name.trim() },
          }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['restaurants'] })
      await navigate({ to: '/restaurantes' })
    },
  })

  if (isEditing && restaurantQuery.isLoading) {
    return <PageShell>{null}</PageShell>
  }

  if (isEditing && restaurantQuery.error) {
    return (
      <PageShell>
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          Não foi possível carregar o restaurante.
        </p>
      </PageShell>
    )
  }

  const errorMessage = createRestaurant.error?.message ?? null

  return (
    <PageShell>
      <div className="mb-6">
        <p className="text-sm font-medium text-[#e9513b]">Parceiros</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {isEditing ? 'Editar restaurante' : 'Novo restaurante'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {isEditing
            ? 'Atualize os dados do restaurante cadastrado.'
            : 'Cadastre um restaurante para adicioná-lo à sua rede.'}
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) return
          createRestaurant.mutate()
        }}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="max-w-xl">
          <label
            htmlFor="restaurant-name"
            className="text-sm font-medium text-slate-700"
          >
            Nome do restaurante
          </label>
          <input
            id="restaurant-name"
            name="nome"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Restaurante Comida"
            required
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#ff6048] focus:ring-2 focus:ring-orange-100"
          />
        </div>

        {errorMessage && (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="mt-7 flex items-center justify-end gap-3">
          <Link
            to="/restaurantes"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createRestaurant.isPending || !name.trim()}
            className="rounded-xl bg-[#ff6048] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e9513b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createRestaurant.isPending
              ? 'Salvando...'
              : isEditing
                ? 'Salvar alterações'
                : 'Cadastrar restaurante'}
          </button>
        </div>
      </form>
    </PageShell>
  )
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <Sidebar />
      <main className="min-h-screen lg:pl-64">
        <DashboardHeader />
        <div className="mx-auto max-w-[900px] px-5 py-7 sm:px-8 sm:py-9">
          {children}
        </div>
      </main>
    </div>
  )
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {}
}

function getString(data: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (typeof data[key] === 'string') return data[key]
  }
  return null
}
