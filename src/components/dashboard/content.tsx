import type { ReactNode } from 'react'
import { ReceiptIcon, StoreIcon } from './icons'
import type { Order, Restaurant } from './types'

export function OrderChart({
  orders,
  loading,
}: {
  orders: Order[]
  loading: boolean
}) {
  const chart = getLastSevenDays(orders)
  const max = Math.max(...chart.map((day) => day.value), 1)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold">Order activity</h2>
          <p className="mt-1 text-xs text-slate-500">
            Orders placed over the last 7 days
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="size-2 rounded-full bg-[#ff6048]" /> Orders
        </div>
      </div>
      <div className="mt-8 flex h-48 items-end gap-2 sm:gap-4">
        {chart.map((day) => (
          <div
            key={day.label}
            className="flex h-full flex-1 flex-col items-center justify-end gap-3"
          >
            <div className="relative flex h-full w-full items-end justify-center">
              <div
                className={`w-full max-w-10 rounded-t-lg bg-[#ff6048] transition-all ${loading ? 'animate-pulse opacity-30' : 'opacity-90'}`}
                style={{
                  height: `${Math.max((day.value / max) * 100, day.value ? 8 : 3)}%`,
                }}
                title={`${day.value} orders`}
              />
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {day.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RestaurantsCard({
  restaurants,
  loading,
}: {
  restaurants: Restaurant[]
  loading: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold">Restaurants</h2>
          <p className="mt-1 text-xs text-slate-500">Your connected partners</p>
        </div>
        <button className="text-xs font-semibold text-[#e9513b]">
          View all
        </button>
      </div>
      {loading ? (
        <div className="mt-7 space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-12 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : restaurants.length > 0 ? (
        <div className="mt-5 space-y-2">
          {restaurants.slice(0, 4).map((restaurant) => (
            <div
              key={restaurant.id}
              className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff0ec] font-semibold text-[#e9513b]">
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
          title="No restaurants yet"
          message="Connected partners will show up here."
          compact
        />
      )}
    </div>
  )
}

export function RecentOrders({ orders }: { orders: Order[] }) {
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <h2 className="font-semibold">Recent orders</h2>
          <p className="mt-1 text-xs text-slate-500">
            The latest activity from your customers
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
          {orders.length} total
        </span>
      </div>
      {orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Restaurant</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.slice(0, 6).map((order) => (
                <tr key={order.id} className="transition hover:bg-slate-50/70">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    #{shortId(order.id)}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {order.restaurant}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {order.itemCount ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<ReceiptIcon />}
          title="No orders yet"
          message="Orders will appear here as soon as customers place them."
        />
      )}
    </section>
  )
}

export function EmptyState({
  icon,
  title,
  message,
  compact = false,
}: {
  icon: ReactNode
  title: string
  message: string
  compact?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10' : 'py-14'}`}
    >
      <div className="mb-3 grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
        {message}
      </p>
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span className="grid size-6 place-items-center rounded-full bg-red-100 font-bold">
        !
      </span>
      <span>{message}</span>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const isPositive = [
    'completed',
    'complete',
    'delivered',
    'paid',
    'success',
  ].some((word) => normalized.includes(word))
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}
    >
      {status}
    </span>
  )
}

function getLastSevenDays(orders: Order[]) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    const value = orders.filter((order) => {
      if (!order.createdAt) return false
      return new Date(order.createdAt).toDateString() === date.toDateString()
    }).length
    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
      value,
    }
  })
}

function shortId(value: string) {
  return value.length > 8 ? value.slice(0, 8) : value
}

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
