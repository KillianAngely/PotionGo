"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { OrderRepository } from "../../00_INFRA/Repositories/Order/OrderRepository"
import { Order, OrderStatus } from "../../00_INFRA/types/Order"

export default function OrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [deleteTarget, setDeleteTarget] = useState<Order | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    const orderRepository = new OrderRepository()

    useEffect(() => {
        loadOrders()
    }, [])

    const loadOrders = async () => {
        setLoading(true)
        try {
            const fetchedOrders = await orderRepository.findAll()
            setOrders(fetchedOrders || [])
        } catch (error) {
            console.error("Erreur lors du chargement des commandes:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredOrders = useMemo(() => {
        if (statusFilter === "all") return orders
        return orders.filter((order) => order.status === statusFilter)
    }, [orders, statusFilter])

    const handleRowClick = (orderId: string) => {
        router.push(`/dashboard/orders/${orderId}`)
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
            setDeleteError(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la suppression de la commande"
            )
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) {
        return <div className="text-sm text-muted">Chargement...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                        Commandes
                    </p>
                    <h2 className="text-xl font-semibold">Suivi des commandes</h2>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-bg/80 px-4 py-3">
                <label htmlFor="statusFilter" className="text-sm font-semibold">
                    Filtrer par statut:
                </label>
                <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                >
                    <option value="all">Tous</option>
                    {Object.values(OrderStatus).map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
                <span className="text-sm text-muted">
                    {filteredOrders.length} commande(s) trouvée(s)
                </span>
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
                            <th className="px-4 py-3">Livraison</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                                    Aucune commande trouvée
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr
                                    key={order.id}
                                    onClick={() => handleRowClick(order.id)}
                                    className="cursor-pointer transition hover:bg-bg/80"
                                >
                                    <td className="px-4 py-3 text-xs text-muted">
                                        {order.id}
                                    </td>
                                    <td className="px-4 py-3">
                                        {order.customerName || order.customerId}
                                    </td>
                                    <td className="px-4 py-3">
                                        {order.driverName || order.driverId || "Non assigné"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={getStatusBadgeClass(order.status)}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {order.items.reduce((total, item) => total + item.quantity, 0)}
                                    </td>
                                    <td className="px-4 py-3 text-muted">
                                        {order.dropoff.address}
                                    </td>
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

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setDeleteTarget(null)}
                        aria-label="Fermer la fenêtre"
                    />
                    <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-glow">
                        <h3 className="text-lg font-semibold">Supprimer cette commande ?</h3>
                        <p className="mt-2 text-sm text-muted">
                            Cette action est définitive. ID: {deleteTarget.id}
                        </p>
                        {deleteError && (
                            <p className="mt-3 text-sm text-red-500">{deleteError}</p>
                        )}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:border-accent/40"
                                disabled={isDeleting}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                className="rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/20"
                                disabled={isDeleting}
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
