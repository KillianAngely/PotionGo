import admin from "../../../../../config/firebase-admin"
import { buildAuthErrorResponse, requireAdmin } from "../../_utils/auth"

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return buildAuthErrorResponse(auth)
  }

  try {
    const [usersSnap, ordersSnap, productsSnap] = await Promise.all([
      admin.firestore().collection("users").where("role", "in", ["driver", "DRIVER"]).get(),
      admin.firestore().collection("orders").get(),
      admin.firestore().collection("products").get(),
    ])

    // Build product price map
    const productPrices: Record<string, number> = {}
    for (const doc of productsSnap.docs) {
      const data = doc.data()
      productPrices[doc.id] = typeof data.price === "number" ? data.price : 0
    }

    // Build per-driver stats from orders
    const driverDelivered: Record<string, { count: number; revenue: number }> = {}
    const driverRejected: Record<string, number> = {}

    for (const doc of ordersSnap.docs) {
      const data = doc.data()
      const status = String(data.status ?? "").toUpperCase()
      const driverId = data.driverId as string | null | undefined
      const rejectedBy = Array.isArray(data.rejectedBy) ? (data.rejectedBy as string[]) : []

      // Count delivered orders and revenue per driver
      if (status === "DELIVERED" && driverId) {
        if (!driverDelivered[driverId]) {
          driverDelivered[driverId] = { count: 0, revenue: 0 }
        }
        driverDelivered[driverId].count += 1

        const items = Array.isArray(data.items) ? data.items : []
        for (const item of items) {
          const potionId =
            typeof item === "object" && item !== null
              ? (item as { potionId?: string }).potionId
              : undefined
          const quantity =
            typeof item === "object" && item !== null
              ? Number((item as { quantity?: unknown }).quantity)
              : 0
          if (potionId && Number.isFinite(quantity)) {
            const price = productPrices[potionId] ?? 0
            driverDelivered[driverId].revenue += price * quantity
          }
        }
      }

      // Count rejections per driver
      for (const rejectedDriverId of rejectedBy) {
        driverRejected[rejectedDriverId] = (driverRejected[rejectedDriverId] ?? 0) + 1
      }
    }

    // Build driver stats array
    const drivers = usersSnap.docs.map((doc) => {
      const data = doc.data()
      const uid = doc.id
      const delivered = driverDelivered[uid]?.count ?? 0
      const revenue = driverDelivered[uid]?.revenue ?? 0
      const rejected = driverRejected[uid] ?? 0
      const totalActions = delivered + rejected
      const acceptanceRate = totalActions > 0 ? (delivered / totalActions) * 100 : 100

      return {
        uid,
        name: `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() || "N/A",
        email: (data.email as string) ?? "",
        totalDeliveries: delivered,
        revenue: Math.round(revenue * 100) / 100,
        acceptanceRate: Math.round(acceptanceRate * 10) / 10,
        averageRating:
          typeof data.averageRating === "number" ? Math.round(data.averageRating * 100) / 100 : 0,
        totalRatings: typeof data.totalRatings === "number" ? data.totalRatings : 0,
      }
    })

    // Compute summary
    const totalDrivers = drivers.length
    const totalRevenue = drivers.reduce((sum, d) => sum + d.revenue, 0)
    const averageAcceptanceRate =
      totalDrivers > 0 ? drivers.reduce((sum, d) => sum + d.acceptanceRate, 0) / totalDrivers : 0
    const driversWithRatings = drivers.filter((d) => d.totalRatings > 0)
    const averageRating =
      driversWithRatings.length > 0
        ? driversWithRatings.reduce((sum, d) => sum + d.averageRating, 0) /
          driversWithRatings.length
        : 0

    return new Response(
      JSON.stringify({
        drivers,
        summary: {
          totalDrivers,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          averageAcceptanceRate: Math.round(averageAcceptanceRate * 10) / 10,
          averageRating: Math.round(averageRating * 100) / 100,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("[GET /api/drivers/stats] Error:", error)
    return new Response(
      JSON.stringify({ error: "Impossible de charger les statistiques des livreurs" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
