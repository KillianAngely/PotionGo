"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { UserRepository } from "../../../00_INFRA/Repositories/User/UserRepository"
import { OrderRepository } from "../../../00_INFRA/Repositories/Order/OrderRepository"
import { User, UserAdminRole, UserClientRole } from "../../../00_INFRA/types/User"
import { Order, OrderStatus } from "../../../00_INFRA/types/Order"

export default function UserDetailPage() {
    const router = useRouter()
    const params = useParams()
    const userId = params.id as string

    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<Order[]>([])
    const [ordersLoading, setOrdersLoading] = useState(false)
    const [ordersError, setOrdersError] = useState<string | null>(null)

    const userRepository = new UserRepository()
    const orderRepository = new OrderRepository()

    useEffect(() => {
        loadUser()
    }, [userId])

    const loadUser = async () => {
        setLoading(true)
        try {
            const fetchedUser = await userRepository.findById(userId)
            setUser(fetchedUser)
            if (fetchedUser) {
                await loadOrdersForUser(fetchedUser)
            } else {
                setOrders([])
            }
        } catch (error) {
            console.error("Erreur lors du chargement de l'utilisateur:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadOrdersForUser = async (targetUser: User) => {
        setOrdersLoading(true)
        setOrdersError(null)
        try {
            const fetchedOrders = await orderRepository.findAll()
            const relevantOrders =
                targetUser.role === UserClientRole.DRIVER
                    ? (fetchedOrders || []).filter((order) => order.driverId === targetUser.uid)
                    : (fetchedOrders || []).filter((order) => order.customerId === targetUser.uid)
            setOrders(relevantOrders)
        } catch (error) {
            console.error("Erreur lors du chargement des commandes:", error)
            setOrdersError(
                error instanceof Error
                    ? error.message
                    : "Erreur lors du chargement des commandes"
            )
        } finally {
            setOrdersLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
            return
        }

        try {
            await userRepository.removeById(userId)
            router.push("/dashboard/users")
        } catch (error) {
            console.error("Erreur lors de la suppression:", error)
            alert("Erreur lors de la suppression de l'utilisateur")
        }
    }

    const getRoleBadgeStyle = (role: string) => {
        const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
        if (role === UserAdminRole.ADMIN) return `${base} bg-accent/15 text-accent`
        if (role === UserClientRole.DRIVER) return `${base} bg-accent2/15 text-accent2`
        return `${base} bg-accent3/15 text-accent3`
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

    if (loading) {
        return <div className="text-sm text-muted">Chargement...</div>
    }

    if (!user) {
        return (
            <div className="space-y-4">
                <h1 className="text-xl font-semibold">Utilisateur non trouvé</h1>
                <button
                    onClick={() => router.push("/dashboard/users")}
                    className="text-sm font-semibold text-accent2 transition hover:text-accent"
                >
                    Retour à la liste
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <button
                onClick={() => router.push("/dashboard/users")}
                className="text-sm font-semibold text-accent2 transition hover:text-accent"
            >
                ← Retour à la liste
            </button>

            <div className="max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-glow">
                <h1 className="text-xl font-semibold">Détails de l'utilisateur</h1>

                <div className="mt-6 grid gap-4 text-sm text-muted">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                            ID
                        </p>
                        <p className="mt-1 text-sm text-fg">{user.uid}</p>
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                            Email
                        </p>
                        <p className="mt-1 text-sm text-fg">{user.email}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                                Prénom
                            </p>
                            <p className="mt-1 text-sm text-fg">{user.firstName}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                                Nom
                            </p>
                            <p className="mt-1 text-sm text-fg">{user.lastName}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                            Rôle
                        </p>
                        <span className={getRoleBadgeStyle(user.role)}>
                            {user.role}
                        </span>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={handleDelete}
                        className="rounded-full border border-accent/30 bg-accent px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-accent/90"
                    >
                        Supprimer l'utilisateur
                    </button>
                </div>
            </div>

            {user.role !== UserAdminRole.ADMIN && (
                <div className="max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-glow">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                                {user.role === UserClientRole.DRIVER
                                    ? "Livraisons"
                                    : "Commandes"}
                            </p>
                            <h2 className="text-lg font-semibold">
                                {user.role === UserClientRole.DRIVER
                                    ? "Liste des livraisons"
                                    : "Liste des commandes"}
                            </h2>
                        </div>
                        <span className="text-sm text-muted">
                            {orders.length} élément(s)
                        </span>
                    </div>

                    {ordersLoading ? (
                        <p className="mt-4 text-sm text-muted">Chargement...</p>
                    ) : ordersError ? (
                        <p className="mt-4 text-sm text-red-500">{ordersError}</p>
                    ) : orders.length === 0 ? (
                        <p className="mt-4 text-sm text-muted">Aucun résultat</p>
                    ) : (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                            <table className="min-w-full divide-y divide-border text-sm">
                                <thead className="bg-bg/80 text-left text-xs uppercase tracking-[0.2em] text-muted">
                                    <tr>
                                        <th className="px-4 py-3">ID</th>
                                        <th className="px-4 py-3">Statut</th>
                                        <th className="px-4 py-3">Articles</th>
                                        <th className="px-4 py-3">Livraison</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                    {orders.map((order) => (
                                        <tr
                                            key={order.id}
                                            onClick={() =>
                                                router.push(`/dashboard/orders/${order.id}`)
                                            }
                                            className="cursor-pointer transition hover:bg-bg/80"
                                        >
                                            <td className="px-4 py-3 text-xs text-muted">
                                                {order.id}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={getStatusBadgeClass(order.status)}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {order.items.reduce(
                                                    (total, item) => total + item.quantity,
                                                    0
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted">
                                                {order.dropoff.address}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
