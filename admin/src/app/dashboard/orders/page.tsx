"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { OrderRepository } from "../../00_INFRA/Repositories/Order/OrderRepository"
import { Order, OrderStatus } from "../../00_INFRA/types/Order"

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]
type SortField = "id" | "status" | "customerName" | "driverName" | "itemCount" | "totalPrice"
type SortDir = "asc" | "desc"

export default function OrdersPage() {
  const router = useRouter()
  const orderRepository = useMemo(() => new OrderRepository(), [])

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [primaryField, setPrimaryField] = useState<SortField>("id")
  const [primaryDir, setPrimaryDir] = useState<SortDir>("desc")
  const [secondaryField, setSecondaryField] = useState<SortField | "none">("status")
  const [secondaryDir, setSecondaryDir] = useState<SortDir>("asc")

  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const sortValue = useMemo(() => {
    const sorts = [`${primaryField}:${primaryDir}`]
    if (secondaryField !== "none" && secondaryField !== primaryField) {
      sorts.push(`${secondaryField}:${secondaryDir}`)
    }
    return sorts
  }, [primaryField, primaryDir, secondaryField, secondaryDir])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const result = await orderRepository.list({
        page,
        pageSize,
        status: statusFilter,
        search: searchTerm.trim() || undefined,
        sort: sortValue,
      })
      setOrders(result.orders)
      setTotal(result.pagination.total)
      setTotalPages(result.pagination.totalPages)
      if (result.pagination.page !== page) setPage(result.pagination.page)
    } catch (error) {
      console.error("Erreur lors du chargement des commandes:", error)
      setOrders([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchTerm, page, pageSize, orderRepository, sortValue])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const handleRowClick = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`)
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (typeof value !== "number") return "—"
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value)
  }

  const getStatusBadgeClass = (status: string) => {
    const base =
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
    if (status === OrderStatus.PENDING) return `${base} bg-accent2/15 text-accent2`
    if (status === OrderStatus.ASSIGNED) return `${base} bg-accent/15 text-accent`
    if (status === OrderStatus.IN_TRANSIT) return `${base} bg-accent/20 text-accent`
    if (status === OrderStatus.DELIVERED) return `${base} bg-emerald-500/15 text-emerald-400`
    return `${base} bg-red-500/15 text-red-400`
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || isDeleting) return
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await orderRepository.removeById(deleteTarget.id)
      await loadOrders()
      setDeleteTarget(null)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Erreur lors de la suppression")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Commandes</p>
          <h2 className="text-xl font-semibold">Suivi des commandes</h2>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-bg/80 px-4 py-3">
        <label htmlFor="statusFilter" className="text-sm font-semibold">
          Statut
        </label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => {
            setPage(1)
            setStatusFilter(e.target.value)
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">Tous</option>
          {Object.values(OrderStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <label htmlFor="orderSearch" className="text-sm font-semibold">
          Recherche
        </label>
        <input
          id="orderSearch"
          value={searchTerm}
          onChange={(e) => {
            setPage(1)
            setSearchTerm(e.target.value)
          }}
          placeholder="ID, client, livreur, adresse"
          className="w-64 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />

        <label htmlFor="primarySort" className="text-sm font-semibold">
          Tri 1
        </label>
        <select
          id="primarySort"
          value={primaryField}
          onChange={(e) => {
            setPage(1)
            setPrimaryField(e.target.value as SortField)
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="id">ID</option>
          <option value="status">Statut</option>
          <option value="customerName">Client</option>
          <option value="driverName">Livreur</option>
          <option value="itemCount">Nb articles</option>
          <option value="totalPrice">Total</option>
        </select>
        <select
          value={primaryDir}
          onChange={(e) => {
            setPage(1)
            setPrimaryDir(e.target.value as SortDir)
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>

        <label htmlFor="secondarySort" className="text-sm font-semibold">
          Tri 2
        </label>
        <select
          id="secondarySort"
          value={secondaryField}
          onChange={(e) => {
            setPage(1)
            setSecondaryField(e.target.value as SortField | "none")
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="none">Aucun</option>
          <option value="id">ID</option>
          <option value="status">Statut</option>
          <option value="customerName">Client</option>
          <option value="driverName">Livreur</option>
          <option value="itemCount">Nb articles</option>
          <option value="totalPrice">Total</option>
        </select>
        <select
          value={secondaryDir}
          onChange={(e) => {
            setPage(1)
            setSecondaryDir(e.target.value as SortDir)
          }}
          disabled={secondaryField === "none"}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>

        <label htmlFor="pageSize" className="text-sm font-semibold">
          Par page
        </label>
        <select
          id="pageSize"
          value={pageSize}
          onChange={(e) => {
            setPage(1)
            setPageSize(Number(e.target.value))
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <span className="ml-auto text-sm text-muted">{total} commande(s)</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-bg/80 text-left text-xs uppercase tracking-[0.2em] text-muted">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Livreur</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Articles</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Livraison</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {!loading && orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  Aucune commande trouvée
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => handleRowClick(order.id)}
                  className="cursor-pointer transition hover:bg-bg/80"
                >
                  <td className="px-4 py-3 text-xs text-muted">{order.id}</td>
                  <td className="px-4 py-3">{order.customerName || order.customerId}</td>
                  <td className="px-4 py-3">
                    {order.driverName || order.driverId || "Non assigné"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(order.totalPrice)}</td>
                  <td className="px-4 py-3 text-muted">{order.dropoff.address}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setDeleteTarget(order)
                      }}
                      className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-500/10"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-bg/70 px-4 py-3">
        <p className="text-sm text-muted">
          Page {page} / {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Précédent
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDeleteTarget(null)}
            aria-label="Fermer"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-glow">
            <h3 className="text-lg font-semibold">Supprimer cette commande ?</h3>
            <p className="mt-2 text-sm text-muted">
              Cette action est définitive. ID: {deleteTarget.id}
            </p>
            {deleteError && <p className="mt-3 text-sm text-red-500">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
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
