import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { apiClient } from '#/api'
import { StoreIcon } from '#/components/dashboard/icons'
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
  const menuQuery = useQuery({
    queryKey: ['restaurant-menu', id],
    queryFn: () =>
      apiClient.request('/menu/{restaurante_id}', 'get', {
        path: { restaurante_id: id! },
      }),
    enabled: isEditing,
    select: normalizeMenu,
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
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) return
          saveRestaurant.mutate()
        }}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
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

        <div className="mb-6 flex flex-col items-center text-center">
          <label
            htmlFor="restaurant-logo"
            className="grid size-28 cursor-pointer place-items-center overflow-hidden rounded-3xl border-2 border-dashed border-orange-200 bg-[#fff0ec] text-[#e9513b] transition hover:border-[#ff6048] hover:bg-orange-50"
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Pré-visualização da logo"
                className="size-full object-cover"
              />
            ) : (
              <StoreIcon />
            )}
          </label>
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
            className="sr-only"
          />
          <p className="mt-2 text-xs text-slate-400">
            Clique para {logoPreview ? 'alterar a' : 'adicionar uma'} logo
          </p>
        </div>

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

      <MenuSection
        items={menuQuery.data ?? []}
        loading={menuQuery.isLoading}
        error={menuQuery.error}
        available={isEditing}
        restaurantId={id}
      />
    </PageShell>
  )
}

type MenuItem = {
  id: string
  name: string
  price: string
}

function MenuSection({
  items,
  loading,
  error,
  available,
  restaurantId,
}: {
  items: MenuItem[]
  loading: boolean
  error: unknown
  available: boolean
  restaurantId?: string
}) {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const createMenuItem = useMutation({
    mutationFn: () =>
      apiClient.request('/menu/{restaurante_id}', 'post', {
        path: { restaurante_id: restaurantId! },
        body: { nome: itemName.trim(), preco: Number(itemPrice) },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['restaurant-menu', restaurantId],
      })
      setItemName('')
      setItemPrice('')
      setIsModalOpen(false)
    },
  })

  return (
    <>
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-semibold">Menu</h2>
            <p className="mt-1 text-xs text-slate-500">
              Itens disponíveis neste restaurante.
            </p>
          </div>
          {available && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl bg-[#ff6048] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#e9513b]"
            >
              Novo item
            </button>
          )}
        </div>

        {!available ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400 sm:px-6">
            Salve o restaurante para visualizar o menu.
          </p>
        ) : loading ? (
          <div className="space-y-3 p-5 sm:p-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <p className="px-5 py-8 text-center text-sm text-red-600 sm:px-6">
            Não foi possível carregar o menu.
          </p>
        ) : items.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
              >
                <p className="text-sm font-medium text-slate-800">
                  {item.name}
                </p>
                <p className="shrink-0 text-sm font-semibold text-[#e9513b]">
                  {formatBRLFromCents(item.price)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-slate-400 sm:px-6">
            Ainda não há itens cadastrados neste menu.
          </p>
        )}
      </section>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-30 grid place-items-center bg-slate-950/30 px-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsModalOpen(false)
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (!itemName.trim() || !itemPrice || !restaurantId) return
              createMenuItem.mutate()
            }}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              Novo item do menu
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Adicione um item disponível para os clientes.
            </p>

            <label
              htmlFor="menu-item-name"
              className="mt-6 block text-sm font-medium text-slate-700"
            >
              Nome do item
            </label>
            <input
              id="menu-item-name"
              type="text"
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#ff6048] focus:ring-2 focus:ring-orange-100"
            />

            <label
              htmlFor="menu-item-price"
              className="mt-4 block text-sm font-medium text-slate-700"
            >
              Preço
            </label>
            <input
              id="menu-item-price"
              type="text"
              inputMode="decimal"
              value={formatBRLFromCents(itemPrice)}
              onChange={(event) =>
                setItemPrice(event.target.value.replace(/\D/g, ''))
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#ff6048] focus:ring-2 focus:ring-orange-100"
            />

            {createMenuItem.error && (
              <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {createMenuItem.error instanceof Error
                  ? createMenuItem.error.message
                  : 'Não foi possível criar o item.'}
              </p>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  createMenuItem.isPending || !itemName.trim() || !itemPrice
                }
                className="rounded-xl bg-[#ff6048] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e9513b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createMenuItem.isPending ? 'Salvando...' : 'Adicionar item'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
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

function normalizeMenu(data: unknown): MenuItem[] {
  const record = asRecord(data)
  const collection = Array.isArray(data)
    ? data
    : (record.items ??
      record.menu ??
      record.cardapio ??
      record.menu_items ??
      record.itens ??
      (getString(record, 'id', 'item_id', 'nome', 'name') ? [record] : []))

  if (!Array.isArray(collection)) return []

  return collection.map((item, index) => {
    const itemRecord = asRecord(item)
    return {
      id: getString(itemRecord, 'id', 'item_id') ?? `menu-item-${index}`,
      name: getString(itemRecord, 'nome', 'name') ?? 'Item sem nome',
      price: getString(itemRecord, 'preco', 'price') ?? '—',
    }
  })
}

function formatBRLFromCents(value: string) {
  const cents = Number(value)
  if (!Number.isFinite(cents) || cents === 0) return ''

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}
