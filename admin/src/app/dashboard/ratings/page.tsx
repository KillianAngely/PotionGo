"use client"

import { useCallback, useEffect, useState } from "react"
import { Rating } from "../../00_INFRA/types/Rating"
import AdminShell from "../../00_INFRA/Components/AdminShell"

export default function RatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    orderId: "",
    revieweeId: "",
    minRating: "1",
  })
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const loadRatings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.orderId) params.set("orderId", filters.orderId)
      if (filters.revieweeId) params.set("revieweeId", filters.revieweeId)
      params.set("minRating", filters.minRating)
      params.set("page", page.toString())
      params.set("pageSize", pageSize.toString())

      const res = await fetch(`/api/ratings?${params}`)
      const data = await res.json()
      if (data.success) {
        setRatings(data.ratings)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching ratings:", error)
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize])

  useEffect(() => {
    loadRatings()
  }, [loadRatings])

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? "text-yellow-400 text-lg" : "text-gray-300 text-lg"}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600"
    if (rating >= 3) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <AdminShell>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion des Évaluations</h1>
          <div className="text-sm text-gray-600">
            Total: {total} évaluation{total !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Filtres</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order ID
              </label>
              <input
                type="text"
                placeholder="Filtrer par Order ID"
                value={filters.orderId}
                onChange={(e) => {
                  setFilters({ ...filters, orderId: e.target.value })
                  setPage(1)
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID (reviewee)
              </label>
              <input
                type="text"
                placeholder="Filtrer par User ID"
                value={filters.revieweeId}
                onChange={(e) => {
                  setFilters({ ...filters, revieweeId: e.target.value })
                  setPage(1)
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note minimale
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => {
                  setFilters({ ...filters, minRating: e.target.value })
                  setPage(1)
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1+ étoiles</option>
                <option value="2">2+ étoiles</option>
                <option value="3">3+ étoiles</option>
                <option value="4">4+ étoiles</option>
                <option value="5">5 étoiles uniquement</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Chargement des évaluations...</p>
          </div>
        ) : ratings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Aucune évaluation trouvée</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Note
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reviewer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reviewee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commentaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ratings.map((rating) => (
                    <tr key={rating.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {renderStars(rating.rating)}
                          <span className={`font-semibold ${getRatingColor(rating.rating)}`}>
                            {rating.rating}/5
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {rating.reviewerId.substring(0, 8)}...
                          </div>
                          <div className="text-gray-500">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              rating.reviewerRole === "CUSTOMER"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}>
                              {rating.reviewerRole}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {rating.revieweeId.substring(0, 8)}...
                          </div>
                          <div className="text-gray-500">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              rating.revieweeRole === "CUSTOMER"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}>
                              {rating.revieweeRole}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        {rating.orderId.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        {rating.comment ? (
                          <div className="truncate" title={rating.comment}>
                            {rating.comment}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Aucun commentaire</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rating.createdAt
                          ? new Date(rating.createdAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Affichage de{" "}
                      <span className="font-medium">{(page - 1) * pageSize + 1}</span> à{" "}
                      <span className="font-medium">
                        {Math.min(page * pageSize, total)}
                      </span>{" "}
                      sur <span className="font-medium">{total}</span> résultats
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Préc.
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pageNum
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Suiv.
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  )
}
