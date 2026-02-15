"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { OrderRepository } from "../../../00_INFRA/Repositories/Order/OrderRepository"
import { Order, OrderStatus } from "../../../00_INFRA/types/Order"

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const orderRepository = useMemo(() => new OrderRepository(), [])

  const loadOrder = useCallback(async () => {
    setLoading(true)
    try {
      const fetchedOrder = await orderRepository.findById(orderId)
      setOrder(fetchedOrder)
    } catch (error) {
      console.error("Erreur lors du chargement de la commande:", error)
    } finally {
      setLoading(false)
    }
  }, [orderId, orderRepository])

  useEffect(() => {
    void loadOrder()
  }, [loadOrder])

  const handleDeleteConfirm = async () => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await orderRepository.removeById(orderId)
      router.push("/dashboard/orders")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      setDeleteError(
        error instanceof Error ? error.message : "Erreur lors de la suppression de la commande",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadgeStyle = (status: string) => {
    const base =
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
    if (status === OrderStatus.PENDING) return `${base} bg-accent2/15 text-accent2`
    if (status === OrderStatus.ASSIGNED) return `${base} bg-accent/15 text-accent`
    if (status === OrderStatus.IN_TRANSIT) return `${base} bg-accent/20 text-accent`
    if (status === OrderStatus.DELIVERED) return `${base} bg-emerald-500/15 text-emerald-400`
    return `${base} bg-red-500/15 text-red-400`
  }

  if (loading) {
    return <div className="text-sm text-muted">Chargement...</div>
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Commande non trouvée</h1>
        <button
          onClick={() => router.push("/dashboard/orders")}
          className="text-sm font-semibold text-accent2 transition hover:text-accent"
        >
          Retour à la liste
        </button>
      </div>
    )
  }

  const itemsTotal = order.items.reduce((total, item) => total + item.quantity, 0)
  const formatCurrency = (value: number | null | undefined) => {
    if (typeof value !== "number") return "—"
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/dashboard/orders")}
        className="text-sm font-semibold text-accent2 transition hover:text-accent"
      >
        ← Retour à la liste
      </button>

      <div className="max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-glow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Détails de la commande</h1>
            <p className="mt-1 text-sm text-muted">ID: {order.id}</p>
          </div>
          <span className={getStatusBadgeStyle(order.status)}>{order.status}</span>
        </div>

        <div className="mt-6 grid gap-4 text-sm text-muted">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Client</p>
            <button
              onClick={() => router.push(`/dashboard/users/${order.customerId}`)}
              className="mt-1 text-left text-sm font-semibold text-accent2 transition hover:text-accent"
            >
              {order.customerName || order.customerId}
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Livreur</p>
            {order.driverId ? (
              <button
                onClick={() => router.push(`/dashboard/users/${order.driverId}`)}
                className="mt-1 text-left text-sm font-semibold text-accent2 transition hover:text-accent"
              >
                {order.driverName || order.driverId}
              </button>
            ) : (
              <p className="mt-1 text-sm text-fg">Non assigné</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Livraison</p>
            <p className="mt-1 text-sm text-fg">{order.dropoff.address}</p>
            <p className="mt-1 text-xs text-muted">
              {order.dropoff.lat}, {order.dropoff.lng}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Départ livreur
            </p>
            {order.driverStart ? (
              <>
                {order.driverStart.address ? (
                  <p className="mt-1 text-sm text-fg">{order.driverStart.address}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted">
                  {order.driverStart.lat}, {order.driverStart.lng}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-fg">—</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Total commande
            </p>
            <p className="mt-1 text-sm text-fg">{formatCurrency(order.totalPrice)}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Articles ({itemsTotal})
            </p>
            <div className="mt-2 space-y-2">
              {order.items.map((item, index) => (
                <div
                  key={`${item.potionId}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg/70 px-4 py-2"
                >
                  <div className="flex items-center gap-3">
                    {item.potionImageUrl ? (
                      <img
                        src={item.potionImageUrl}
                        alt={item.potionName || item.potionId}
                        className="h-10 w-10 rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg border border-border bg-bg/60" />
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/products/${item.potionId}`)}
                      className="text-left text-sm font-semibold text-accent2 transition hover:text-accent"
                    >
                      {item.potionName || item.potionId}
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-fg">x{item.quantity}</p>
                    <p className="text-xs text-muted">{formatCurrency(item.lineTotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/20"
          >
            Supprimer la commande
          </button>
        </div>
      </div>

      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setIsDeleteOpen(false)
              setDeleteError(null)
            }}
            aria-label="Fermer"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-glow">
            <h3 className="text-lg font-semibold">Supprimer cette commande ?</h3>
            <p className="mt-2 text-sm text-muted">Cette action est définitive. ID: {order.id}</p>
            {deleteError && <p className="mt-3 text-sm text-red-500">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false)
                  setDeleteError(null)
                }}
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500 disabled:opacity-60"
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
