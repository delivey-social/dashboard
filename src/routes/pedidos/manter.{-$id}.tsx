import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ReceiptIcon } from '#/components/dashboard/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { apiClient } from '#/api'
import { useDashboardData } from '#/hooks/use-dashboard-data'

export const Route = createFileRoute('/pedidos/manter/{-$id}')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { restaurants, restaurantsQuery } = useDashboardData()
  const [restaurantId, setRestaurantId] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const userId = getCurrentUserId()

  const pedidoQuery = useQuery({
    queryKey: ['pedido', id],
    queryFn: () =>
      apiClient.request('/pedido/{pedido_id}', 'get', {
        path: { pedido_id: id! },
      }),
    enabled: isEditing,
  })

  useEffect(() => {
    if (!pedidoQuery.data) return
    const pedido = asRecord(pedidoQuery.data)
    const selectedRestaurantId = getString(
      pedido,
      'restaurant_id',
      'restaurante_id',
    )
    if (selectedRestaurantId) setRestaurantId(selectedRestaurantId)

    const selectedQuantities: Record<string, number> = {}
    const items = asArray(pedido.items)
    items.forEach((item) => {
      const itemRecord = asRecord(item)
      const productId = getString(itemRecord, 'product_id', 'item_id', 'id')
      const quantity = getNumber(itemRecord, 'quantity', 'quantidade')
      if (productId && quantity) selectedQuantities[productId] = quantity
    })
    setQuantities(selectedQuantities)
  }, [pedidoQuery.data])

  const menuQuery = useQuery({
    queryKey: ['restaurant-menu', restaurantId],
    queryFn: () =>
      apiClient.request('/menu/{restaurante_id}', 'get', {
        path: { restaurante_id: restaurantId },
      }),
    enabled: Boolean(restaurantId),
  })
  const menuItems = normalizeMenu(menuQuery.data)

  const savePedido = useMutation({
    mutationFn: () => {
      const body = {
        user_id: userId!,
        restaurant_id: restaurantId,
        items: menuItems
          .filter((item) => (quantities[item.id] ?? 0) > 0)
          .map((item) => ({
            product_id: item.id,
            quantity: quantities[item.id],
          })),
      }

      return isEditing
        ? apiClient.request('/pedido/{pedido_id}', 'put', {
            path: { pedido_id: id! },
            body,
          })
        : apiClient.request('/pedido/', 'post', { body })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      await navigate({ to: '/pedidos' })
    },
  })

  const setQuantity = (itemId: string, quantity: number) => {
    setQuantities((current) => {
      const next = { ...current }
      if (quantity > 0) next[itemId] = quantity
      else delete next[itemId]
      return next
    })
  }

  const selectedItemCount = Object.values(quantities).reduce(
    (total, quantity) => total + quantity,
    0,
  )

  return (
    <section className="max-w-2xl mx-auto">
      <Link
        to="/pedidos"
        className="mb-4 inline-block rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
      >
        ← Voltar
      </Link>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!restaurantId || !userId || selectedItemCount === 0) return
          savePedido.mutate()
        }}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="mb-6 flex items-start gap-4">
          <div>
            <p className="text-sm font-medium text-[#e9513b]">Operações</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {isEditing ? 'Editar pedido' : 'Novo pedido'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isEditing
                ? 'Atualize os dados do pedido registrado.'
                : 'Cadastre um novo pedido no sistema.'}
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="pedido-restaurant"
              className="text-sm font-medium text-slate-700"
            >
              Restaurante
            </label>
            <select
              id="pedido-restaurant"
              value={restaurantId}
              onChange={(event) => {
                setRestaurantId(event.target.value)
                setQuantities({})
              }}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ff6048] focus:ring-2 focus:ring-orange-100"
            >
              <option value="">
                {restaurantsQuery.isLoading
                  ? 'Carregando restaurantes...'
                  : 'Selecione um restaurante'}
              </option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="pedido-user"
              className="text-sm font-medium text-slate-700"
            >
              Usuário
            </label>
            <select
              id="pedido-user"
              value={userId ?? ''}
              disabled
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
            >
              <option value={userId ?? ''}>
                {userId ? 'Usuário atual' : 'Usuário não identificado'}
              </option>
            </select>
          </div>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Itens</h2>
              <p className="mt-1 text-xs text-slate-400">
                Selecione os itens do menu e informe a quantidade.
              </p>
            </div>
            {selectedItemCount > 0 && (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#e9513b]">
                {selectedItemCount} item{selectedItemCount === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {!restaurantId ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              Selecione um restaurante para visualizar o menu.
            </p>
          ) : menuQuery.isLoading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : menuQuery.error ? (
            <p className="px-5 py-8 text-center text-sm text-red-600">
              Não foi possível carregar o menu.
            </p>
          ) : menuItems.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              Este restaurante ainda não possui itens no menu.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {menuItems.map((item) => {
                const quantity = quantities[item.id] ?? 0
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <input
                      type="checkbox"
                      checked={quantity > 0}
                      onChange={(event) =>
                        setQuantity(item.id, event.target.checked ? 1 : 0)
                      }
                      className="size-4 accent-[#ff6048]"
                      aria-label={`Selecionar ${item.name}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-[#e9513b]">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-500">
                      Quantidade
                      <input
                        type="number"
                        min="1"
                        value={quantity || ''}
                        disabled={quantity === 0}
                        onChange={(event) =>
                          setQuantity(
                            item.id,
                            Math.max(1, Number(event.target.value) || 1),
                          )
                        }
                        className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#ff6048] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
                      />
                    </label>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {savePedido.error && (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            Não foi possível salvar o pedido.
          </p>
        )}

        <div className="mt-7 flex items-center justify-end gap-3">
          <Link
            to="/pedidos"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={
              savePedido.isPending ||
              !restaurantId ||
              !userId ||
              selectedItemCount === 0
            }
            className="rounded-xl bg-[#ff6048] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e9513b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savePedido.isPending
              ? 'Salvando...'
              : isEditing
                ? 'Salvar alterações'
                : 'Cadastrar pedido'}
          </button>
        </div>
      </form>
    </section>
  )
}

type MenuItem = {
  id: string
  name: string
  price: string
}

function normalizeMenu(data: unknown): MenuItem[] {
  const record = asRecord(data)
  const collection = Array.isArray(data) ? data : asArray(record.itens)

  return collection.map((item, index) => {
    const itemRecord = asRecord(item)
    return {
      id: getString(itemRecord, 'id', 'item_id') ?? `menu-item-${index}`,
      name: getString(itemRecord, 'nome', 'name') ?? 'Item sem nome',
      price: getString(itemRecord, 'preco', 'price') ?? '—',
    }
  })
}

function getCurrentUserId(): string | null {
  try {
    const token = sessionStorage.getItem('comida.access_token')
    if (!token) return null
    const payload = token.split('.')[1]
    const decoded = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map(
            (character) =>
              `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`,
          )
          .join(''),
      ),
    ) as Record<string, unknown>
    return getString(decoded, 'sub', 'user_id')
  } catch {
    return null
  }
}

function formatPrice(value: string) {
  const cents = Number(value)
  if (!Number.isFinite(cents)) return value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function getString(
  data: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    }
  }
  return null
}

function getNumber(
  data: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'number') return value
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}
