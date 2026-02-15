"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { UserRepository } from "../../../00_INFRA/Repositories/User/UserRepository"
import { OrderRepository } from "../../../00_INFRA/Repositories/Order/OrderRepository"
import { RatingRepository } from "../../../00_INFRA/Repositories/Rating/RatingRepository"
import { User, UserAdminRole, UserClientRole } from "../../../00_INFRA/types/User"
import { Order, OrderStatus } from "../../../00_INFRA/types/Order"
import { Rating, UserRatingStats } from "../../../00_INFRA/types/Rating"

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [ratingStats, setRatingStats] = useState<UserRatingStats | null>(null)
  const [ratingsLoading, setRatingsLoading] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const userRepository = useMemo(() => new UserRepository(), [])
  const orderRepository = useMemo(() => new OrderRepository(), [])
  const ratingRepository = useMemo(() => new RatingRepository(), [])

  const loadOrdersForUser = useCallback(
    async (targetUser: User) => {
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
          error instanceof Error ? error.message : "Erreur lors du chargement des commandes",
        )
      } finally {
        setOrdersLoading(false)
      }
    },
    [orderRepository],
  )

  const loadRatingsForUser = useCallback(
    async (targetUser: User) => {
      setRatingsLoading(true)
      try {
        const response = await ratingRepository.findByUserId(targetUser.uid)
        setRatings(response.ratings)
        setRatingStats(response.stats)
      } catch (error) {
        console.error("Erreur lors du chargement des ratings:", error)
      } finally {
        setRatingsLoading(false)
      }
    },
    [ratingRepository],
  )

  const loadUser = useCallback(async () => {
    setLoading(true)
    try {
      const fetchedUser = await userRepository.findById(userId)
      setUser(fetchedUser)
      if (fetchedUser) {
        await loadOrdersForUser(fetchedUser)
        await loadRatingsForUser(fetchedUser)
      } else {
        setOrders([])
        setRatings([])
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'utilisateur:", error)
    } finally {
      setLoading(false)
    }
  }, [loadOrdersForUser, loadRatingsForUser, userId, userRepository])

  useEffect(() => {
    void loadUser()
  }, [loadUser])

  const handleDeleteConfirm = async () => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await userRepository.removeById(userId)
      router.push("/dashboard/users")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      setDeleteError(
        error instanceof Error ? error.message : "Erreur lors de la suppression de l'utilisateur",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const getRoleBadgeStyle = (role: string) => {
    const base =
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? "text-yellow-400 text-lg" : "text-gray-400 text-lg"}
          >
            ★
          </span>
        ))}
      </div>
    )
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
        <h1 className="text-xl font-semibold">Détails de l&apos;utilisateur</h1>

        <div className="mt-6 grid gap-4 text-sm text-muted">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">ID</p>
            <p className="mt-1 text-sm text-fg">{user.uid}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Email</p>
            <p className="mt-1 text-sm text-fg">{user.email}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Prénom</p>
              <p className="mt-1 text-sm text-fg">{user.firstName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Nom</p>
              <p className="mt-1 text-sm text-fg">{user.lastName}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Rôle</p>
            <span className={getRoleBadgeStyle(user.role)}>{user.role}</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="rounded-full border border-accent/30 bg-accent px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-accent/90"
          >
            Supprimer l&apos;utilisateur
          </button>
        </div>
      </div>

      {user.role !== UserAdminRole.ADMIN && (
        <div className="max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-glow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Évaluations</h2>
            {ratingsLoading && <span className="text-sm text-muted">Chargement...</span>}
          </div>

          {ratingStats && ratingStats.totalRatings > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 rounded-lg bg-bg/50">
                  <div className="flex justify-center mb-2">
                    {renderStars(Math.round(ratingStats.averageRating))}
                  </div>
                  <div className="text-3xl font-bold text-yellow-500 mb-1">
                    {ratingStats.averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted">Moyenne</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-bg/50">
                  <div className="text-3xl font-bold mb-1">{ratingStats.totalRatings}</div>
                  <div className="text-sm text-muted">Total évaluations</div>
                </div>
                <div className="p-4 rounded-lg bg-bg/50">
                  <div className="text-sm font-semibold mb-2 text-muted">Distribution</div>
                  <div className="space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-8">{star}★</span>
                        <div className="flex-1 bg-bg h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-yellow-400 h-2"
                            style={{
                              width: `${
                                (ratingStats.ratingDistribution[star as 1 | 2 | 3 | 4 | 5] /
                                  ratingStats.totalRatings) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-muted">
                          {ratingStats.ratingDistribution[star as 1 | 2 | 3 | 4 | 5]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted">
                  Derniers commentaires ({Math.min(5, ratings.length)})
                </h3>
                <div className="space-y-3">
                  {ratings.slice(0, 5).map((rating) => (
                    <div
                      key={rating.id}
                      className="border-l-4 border-yellow-400 pl-4 py-2 bg-bg/30 rounded-r"
                    >
                      <div className="flex items-center gap-3 mb-1">
                        {renderStars(rating.rating)}
                        <span className="text-xs text-muted">
                          {rating.createdAt
                            ? new Date(rating.createdAt).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </span>
                        <span className="text-xs text-muted">
                          par {rating.reviewerRole === "CUSTOMER" ? "Client" : "Livreur"}
                        </span>
                      </div>
                      {rating.comment && <p className="text-sm text-fg mt-1">{rating.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Aucune évaluation pour cet utilisateur</p>
          )}
        </div>
      )}

      {user.role !== UserAdminRole.ADMIN && (
        <div className="max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-glow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {user.role === UserClientRole.DRIVER ? "Livraisons" : "Commandes"}
              </p>
              <h2 className="text-lg font-semibold">
                {user.role === UserClientRole.DRIVER
                  ? "Liste des livraisons"
                  : "Liste des commandes"}
              </h2>
            </div>
            <span className="text-sm text-muted">{orders.length} élément(s)</span>
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
                      onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                      className="cursor-pointer transition hover:bg-bg/80"
                    >
                      <td className="px-4 py-3 text-xs text-muted">{order.id}</td>
                      <td className="px-4 py-3">
                        <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {order.items.reduce((total, item) => total + item.quantity, 0)}
                      </td>
                      <td className="px-4 py-3 text-muted">{order.dropoff.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
          <div className="relative w-[min(92vw,460px)] rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Supprimer ce compte ?</h3>
            <p className="mt-3 text-sm text-muted">
              {user.firstName} {user.lastName} — {user.email}
            </p>
            {deleteError && <p className="mt-3 text-sm text-red-600">{deleteError}</p>}
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
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
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
