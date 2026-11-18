import { useQuery } from '@tanstack/react-query'
import { apiClient } from '#/api'
import type { Order, Restaurant } from '#/components/dashboard/types'

type JsonRecord = Record<string, unknown>

export function useDashboardData() {
  const restaurantsQuery = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => apiClient.request('/restaurante/', 'get'),
    select: normalizeRestaurants,
  })
  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiClient.request('/pedido/', 'get'),
    select: normalizeOrders,
  })
  const versionQuery = useQuery({
    queryKey: ['version'],
    queryFn: () => apiClient.request('/version', 'get'),
    select: (data) => getString(asRecord(data), 'version') ?? '—',
  })

  return {
    restaurants: restaurantsQuery.data ?? [],
    orders: ordersQuery.data ?? [],
    restaurantsQuery,
    ordersQuery,
    versionQuery,
    error: restaurantsQuery.error ?? ordersQuery.error,
  }
}

function normalizeRestaurants(data: unknown): Restaurant[] {
  return getCollection(data, ['restaurantes', 'restaurants']).map(
    (item, index) => ({
      id: getString(item, 'id', 'restaurante_id') ?? `restaurant-${index}`,
      name: getString(item, 'nome', 'name') ?? 'Restaurante sem nome',
      subtitle:
        getString(item, 'cidade', 'address', 'email') ??
        'Restaurante conectado',
    }),
  )
}

function normalizeOrders(data: unknown): Order[] {
  return getCollection(data, ['pedidos', 'orders']).map((item, index) => {
    const items = getArray(item, 'items')
    const itemCount = items.reduce((total, value) => {
      if (!isRecord(value)) return total
      const quantity = getNumber(value, 'quantity', 'quantidade')
      return total + (quantity ?? 0)
    }, 0)
    const total = items.reduce((sum, value) => {
      if (!isRecord(value)) return sum
      const quantity = getNumber(value, 'quantity', 'quantidade') ?? 0
      const price =
        getNumber(value, 'price_snapshot', 'preco', 'price') ?? 0
      return sum + quantity * price
    }, 0)
    const restaurantId =
      getString(item, 'restaurant_id', 'restaurante_id') ?? null

    return {
      id: getString(item, 'id', 'pedido_id') ?? `order-${index}`,
      restaurant:
        getString(item, 'restaurant_name', 'restaurante_nome') ??
        restaurantId ??
        'Restaurante',
      status: getString(item, 'status', 'state') ?? 'Recebido',
      createdAt: getString(item, 'created_at', 'createdAt', 'data_criacao'),
      itemCount: itemCount || null,
      userId: getString(item, 'user_id', 'usuario_id'),
      restaurantId,
      total: items.length > 0 ? total : null,
    }
  })
}

function getCollection(data: unknown, keys: string[]): JsonRecord[] {
  if (Array.isArray(data)) return data.filter(isRecord)
  if (!isRecord(data)) return []
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key].filter(isRecord)
  }
  return []
}

function getString(data: JsonRecord, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    }
  }
  return null
}

function getArray(data: JsonRecord, key: string): unknown[] {
  return Array.isArray(data[key]) ? data[key] : []
}

function getNumber(data: JsonRecord, ...keys: string[]): number | null {
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

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {}
}
