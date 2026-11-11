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
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  useEffect(() => {
    if (restaurantQuery.data) {
      const restaurant = asRecord(restaurantQuery.data)
      setName(getString(restaurant, 'nome', 'name') ?? '')
    }
  }, [restaurantQuery.data])
  const logoQuery = useQuery({
    queryKey: ['restaurant-logo', id],
    queryFn: () =>
      apiClient.request('/restaurante/{restaurante_id}/logo', 'get', {
        path: { restaurante_id: id! },
      }),
    enabled: isEditing,
  })
  useEffect(() => {
    if (!logoQuery.data) return
    if (logoQuery.data instanceof Blob) {
      const previewUrl = URL.createObjectURL(logoQuery.data)
      setLogoPreview(previewUrl)
      return () => URL.revokeObjectURL(previewUrl)
    }
    if (typeof logoQuery.data === 'string') setLogoPreview(logoQuery.data)
  }, [logoQuery.data])
  const saveRestaurant = useMutation({
    mutationFn: async () => {
      const response = isEditing
        ? await apiClient.request('/restaurante/{restaurante_id}', 'put', {
            path: { restaurante_id: id! },
            body: { nome: name.trim() },
          })
        : await apiClient.request('/restaurante/', 'post', {
            body: { nome: name.trim() },
          })
      const restaurantId =
        id ?? getString(asRecord(response), 'id', 'restaurante_id')
      if (logoFile && !restaurantId) {
        throw new Error(
          'O restaurante foi criado, mas seu ID não foi retornado.',
        )
      }
      if (logoFile && restaurantId) {
        const formData = new FormData()
        formData.append('file', logoFile)
        await apiClient.request('/restaurante/{restaurante_id}/logo', 'put', {
          path: { restaurante_id: restaurantId },
          body: formData,
        })
      }
      return response
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['restaurants'] })
      await queryClient.invalidateQueries({ queryKey: ['restaurant', id] })
      await queryClient.invalidateQueries({ queryKey: ['restaurant-logo', id] })
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

  const errorMessage = saveRestaurant.error?.message ?? null

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
          saveRestaurant.mutate()
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
          <label
            htmlFor="restaurant-logo"
            className="mt-5 block text-sm font-medium text-slate-700"
          >
            Logo do restaurante
          </label>
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Pré-visualização da logo"
              className="mt-2 size-24 rounded-2xl border border-slate-200 object-cover"
            />
          )}
          <input
            id="restaurant-logo"
            name="logo"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              setLogoFile(file)
              if (file) setLogoPreview(URL.createObjectURL(file))
            }}
            className="mt-2 block w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-50 file:px-4 file:py-2.5 file:font-semibold file:text-orange-500 hover:file:bg-orange-100"
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
            disabled={saveRestaurant.isPending || !name.trim()}
            className="rounded-xl bg-[#ff6048] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e9513b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveRestaurant.isPending
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
    if (typeof data[key] === 'string' || typeof data[key] === 'number') {
      return String(data[key])
    }
  }
  return null
}
