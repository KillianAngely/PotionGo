import admin from "../../../../../config/firebase-admin"
import { buildAuthErrorResponse, requireAdmin } from "../../_utils/auth"

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return buildAuthErrorResponse(auth)
  }

  try {
    const [usersSnap, productsSnap, ordersSnap, ratingsSnap] = await Promise.all([
      admin.firestore().collection("users").get(),
      admin.firestore().collection("products").get(),
      admin.firestore().collection("orders").get(),
      admin.firestore().collection("ratings").get(),
    ])

    const roleCounts = { ADMIN: 0, CUSTOMER: 0, DRIVER: 0 }
    for (const doc of usersSnap.docs) {
      const role = String(doc.data().role ?? "").toUpperCase()
      if (role in roleCounts) {
        roleCounts[role as keyof typeof roleCounts] += 1
      }
    }

    const statusCounts: Record<string, number> = {}
    let revenue = 0
    for (const doc of ordersSnap.docs) {
      const data = doc.data()
      const status = String(data.status ?? "").toUpperCase() || "UNKNOWN"
      statusCounts[status] = (statusCounts[status] ?? 0) + 1

      const items = Array.isArray(data.items) ? data.items : []
      if (items.length === 0) continue
      // Revenue estimate based on current product prices.
      const quantityTotal = items.reduce((sum: number, item: unknown) => {
        const quantity =
          typeof item === "object" &&
          item !== null &&
          "quantity" in item
            ? Number((item as { quantity?: unknown }).quantity)
            : NaN
        return sum + (Number.isFinite(quantity) ? quantity : 0)
      }, 0)
      revenue += quantityTotal
    }

    // Rating statistics
    const allRatings = ratingsSnap.docs.map((doc) => doc.data().rating as number)
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    allRatings.forEach((rating) => {
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating as 1 | 2 | 3 | 4 | 5]++
      }
    })
    const averageRating = allRatings.length
      ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
      : 0

    return new Response(
      JSON.stringify({
        success: true,
        totals: {
          users: usersSnap.size,
          products: productsSnap.size,
          orders: ordersSnap.size,
          ratings: ratingsSnap.size,
        },
        roles: roleCounts,
        orderStatuses: statusCounts,
        estimatedUnitsSold: revenue,
        ratings: {
          total: ratingsSnap.size,
          average: Math.round(averageRating * 100) / 100,
          distribution: ratingDistribution,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("[GET /api/dashboard/stats] Error:", error)
    return new Response(
      JSON.stringify({ error: "Impossible de charger les statistiques" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
