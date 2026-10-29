import { createFileRoute } from '@tanstack/react-router'
import {
  CheckIcon,
  ChevronIcon,
  PulseIcon,
  ReceiptIcon,
  StoreIcon,
} from '#/components/dashboard/icons'
import {
  ErrorBanner,
  OrderChart,
  RecentOrders,
  RestaurantsCard,
} from '#/components/dashboard/content'
import { DashboardHeader, Sidebar } from '#/components/dashboard/layout'
import { MetricCard } from '#/components/dashboard/metric-card'
import { useDashboardData } from '#/hooks/use-dashboard-data'
import type { Order } from '#/components/dashboard/types'
import UserGreeting from '#/components/dashboard/user-greeting'

export const Route = createFileRoute('/')({
  component: Page,
})

function Page() {
  const { restaurants, orders, restaurantsQuery, ordersQuery, error } =
    useDashboardData()

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <Sidebar />

      <main className="min-h-screen lg:pl-64">
        <DashboardHeader />

        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9">
          <UserGreeting />

          {error && <ErrorBanner message={getErrorMessage(error)} />}

          <SummaryCardsArea />

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

function SummaryCardsArea() {
  const { restaurants, orders, restaurantsQuery, ordersQuery, versionQuery } =
    useDashboardData()

  return (
    <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total restaurants"
        value={restaurantsQuery.isLoading ? '—' : restaurants.length.toString()}
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
          ordersQuery.isLoading ? '—' : countActiveToday(orders).toString()
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
  )
}
