import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { apiClient } from '#/api'
import { DashboardHeader, Sidebar } from '#/components/dashboard/layout'

export const Route = createFileRoute('/restaurates/manter')({
  component: RestaurantFormPage,
})

function RestaurantFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const createRestaurant = useMutation({
    mutationFn: () =>
      apiClient.request('/restaurante/', 'post', {
        body: { nome: name.trim() },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['restaurants'] })
      await navigate({ to: '/restaurantes' })
    },
  })

  const errorMessage = createRestaurant.error?.message ?? null

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <Sidebar />

      <main className="min-h-screen lg:pl-64">
        <DashboardHeader />

        <div className="mx-auto max-w-[900px] px-5 py-7 sm:px-8 sm:py-9">
          <div className="mb-6">
            <p className="text-sm font-medium text-[#e9513b]">Parceiros</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Novo restaurante
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Cadastre um restaurante para adicioná-lo à sua rede.
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
                  : 'Cadastrar restaurante'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
