export type OrderStatus =
  'pending' | 'confirmed' | 'delivering' | 'delivered' | 'canceled'

export const ORDER_STATUS_OPTIONS: {
  value: OrderStatus
  label: string
}[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'delivering', label: 'Em entrega' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'canceled', label: 'Cancelado' },
]

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-600',
  confirmed: 'bg-blue-50 text-blue-600',
  delivering: 'bg-violet-50 text-violet-600',
  delivered: 'bg-emerald-50 text-emerald-600',
  canceled: 'bg-red-50 text-red-600',
}

export function getOrderStatusLabel(status: string): string {
  return (
    ORDER_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  )
}

export function getOrderStatusStyles(status: string): string {
  return isOrderStatus(status)
    ? ORDER_STATUS_STYLES[status]
    : 'bg-slate-100 text-slate-600'
}

export function isOrderStatus(value: string | null): value is OrderStatus {
  return ORDER_STATUS_OPTIONS.some((option) => option.value === value)
}
