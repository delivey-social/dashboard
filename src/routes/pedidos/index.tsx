import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { EmptyState, ErrorBanner } from '#/components/dashboard/content'
import { ReceiptIcon } from '#/components/dashboard/icons'
import type { Order } from '#/components/dashboard/types'
import { useDashboardData } from '#/hooks/use-dashboard-data'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiClient } from '#/api'

export const Route = createFileRoute('/pedidos/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { restaurants, orders, ordersQuery } = useDashboardData()
  const restaurantNames = new Map(
    restaurants.map((restaurant) => [restaurant.id, restaurant.name]),
  )

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-medium text-[#e9513b]">Operações</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Pedidos</h1>
        <p className="mt-2 text-sm text-slate-500">
          Lista de pedidos registrados no sistema.
        </p>
      </div>

      {ordersQuery.error && (
        <ErrorBanner message={getErrorMessage(ordersQuery.error)} />
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-semibold">Pedidos registrados</h2>
            <p className="mt-1 text-xs text-slate-500">
              {ordersQuery.isLoading
                ? 'Carregando pedidos...'
                : `${orders.length} pedido${orders.length === 1 ? '' : 's'} registrado${orders.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <Link
            to="/pedidos/manter/{-$id}"
            params={{}}
            className="rounded-xl bg-[#ff6048] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#e9513b]"
          >
            Novo pedido
          </Link>
        </div>

        {ordersQuery.isLoading ? (
          <div className="space-y-3 p-5 sm:p-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-6 py-3">Pedido</th>
                  <th className="px-6 py-3">Restaurante</th>
                  <th className="px-6 py-3">Usuário</th>
                  <th className="px-6 py-3">Itens</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    restaurantName={
                      order.restaurantId
                        ? restaurantNames.get(order.restaurantId)
                        : undefined
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<ReceiptIcon />}
            title="Ainda não há pedidos"
            message="Os pedidos registrados aparecerão aqui."
          />
        )}
      </section>
    </>
  )
}

function OrderRow({
  order,
  restaurantName,
}: {
  order: Order
  restaurantName?: string
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const deletePedido = useMutation({
    mutationFn: () =>
      apiClient.request('/pedido/{pedido_id}', 'delete', {
        path: { pedido_id: order.id },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      setIsDeleteModalOpen(false)
    },
  })

  return (
    <>
      <tr
        role="link"
        tabIndex={0}
        onClick={() =>
          navigate({
            to: '/pedidos/manter/{-$id}',
            params: { id: order.id },
          })
        }
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            navigate({
              to: '/pedidos/manter/{-$id}',
              params: { id: order.id },
            })
          }
        }}
        className="cursor-pointer transition hover:bg-slate-50/70 focus:bg-slate-50/70 focus:outline-none"
      >
        <td className="px-6 py-4 font-medium text-slate-900">
          <Link
            to="/pedidos/manter/{-$id}"
            params={{ id: order.id }}
            className="text-slate-900 transition hover:text-[#e9513b]"
          >
            #{shortId(order.id)}
          </Link>
        </td>
        <td className="px-6 py-4 text-slate-600">
          {restaurantName ?? order.restaurant}
        </td>
        <td className="px-6 py-4 text-slate-600">
          {order.userId ? shortId(order.userId) : '—'}
        </td>
        <td className="px-6 py-4 text-slate-600">{order.itemCount ?? '—'}</td>
        <td className="px-6 py-4 text-slate-600">
          {order.total === null
            ? '—'
            : order.total.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
        </td>
        <td className="px-6 py-4">
          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
            {order.status}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <button
            type="button"
            aria-label={`Excluir pedido #${shortId(order.id)}`}
            title="Excluir pedido"
            onClick={(event) => {
              event.stopPropagation()
              setIsDeleteModalOpen(true)
            }}
            className="shrink-0 cursor-pointer rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
          >
            <TrashIcon />
          </button>
        </td>
      </tr>

      {isDeleteModalOpen && (
        <tr>
          <td colSpan={7}>
            <div
              className="fixed inset-0 z-30 grid place-items-center bg-slate-950/30 px-5"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setIsDeleteModalOpen(false)
                }
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`delete-pedido-${order.id}`}
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
              >
                <h3
                  id={`delete-pedido-${order.id}`}
                  className="text-lg font-semibold text-slate-900"
                >
                  Excluir pedido?
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  O pedido <strong>#{shortId(order.id)}</strong> será removido
                  permanentemente.
                </p>
                {deletePedido.error && (
                  <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Não foi possível excluir o pedido.
                  </p>
                )}
                <div className="mt-7 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePedido.mutate()}
                    disabled={deletePedido.isPending}
                    className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletePedido.isPending ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M4.5 6.5h11M8 3.5h4l.7 3H7.3l.7-3Z" />
      <path
        d="m6 6.5.6 10h6.8l.6-10M8.5 9.5v4.5M11.5 9.5v4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}...` : id
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar os pedidos.'
}
