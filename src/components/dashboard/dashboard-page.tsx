import {
  CheckIcon,
  ChevronIcon,
  PulseIcon,
  ReceiptIcon,
  StoreIcon,
} from './icons'
import {
  ErrorBanner,
  OrderChart,
  RecentOrders,
  RestaurantsCard,
} from './content'
import { DashboardHeader, Sidebar } from './layout'
import { MetricCard } from './metric-card'
import { useDashboardData } from '#/hooks/use-dashboard-data'
import type { Order } from './types'

export function DashboardPage() {
  const {
    restaurants,
    orders,
    restaurantsQuery,
    ordersQuery,
    versionQuery,
    error,
  } = useDashboardData()

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <Sidebar />
      <main className="min-h-screen lg:pl-64">
        <DashboardHeader />
        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-[#ff6048]">
                Thursday, October 29
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Good morning, Thiago
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Here&apos;s what&apos;s happening across your food network.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300">
                Last 7 days <ChevronIcon />
              </button>
              <button
                onClick={() => {
                  void restaurantsQuery.refetch()
                  void ordersQuery.refetch()
                }}
                className="rounded-xl bg-[#ff6048] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-[#e9513b]"
              >
                Refresh data
              </button>
            </div>
          </div>
          {error && <ErrorBanner message={getErrorMessage(error)} />}
          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total restaurants"
              value={
                restaurantsQuery.isLoading ? '—' : restaurants.length.toString()
              }
              detail="Registered in the network"
              icon={<StoreIcon />}
              accent="orange"
            />
            <MetricCard
              label="Total orders"
              value={ordersQuery.isLoading ? '—' : orders.length.toString()}
              detail="All-time orders recorded"
              icon={<ReceiptIcon />}
              accent="blue"
            />
            <MetricCard
              label="Active today"
              value={
                ordersQuery.isLoading
                  ? '—'
                  : countActiveToday(orders).toString()
              }
              detail="Orders placed today"
              icon={<PulseIcon />}
              accent="green"
            />
            <MetricCard
              label="API status"
              value={versionQuery.isLoading ? '—' : 'Operational'}
              detail={`Version ${versionQuery.data ?? '—'}`}
              icon={<CheckIcon />}
              accent="purple"
            />
          </section>
          <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
            <OrderChart orders={orders} loading={ordersQuery.isLoading} />
            <RestaurantsCard
              restaurants={restaurants}
              loading={restaurantsQuery.isLoading}
            />
          </section>
          <RecentOrders orders={orders} />
        </div>
      </main>
    </div>
  )
}

function countActiveToday(orders: Order[]) {
  const today = new Date().toDateString()
  return orders.filter(
    (order) =>
      order.createdAt && new Date(order.createdAt).toDateString() === today,
  ).length
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Unable to load dashboard data.'
}
