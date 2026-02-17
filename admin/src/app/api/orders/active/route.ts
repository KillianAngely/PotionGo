import admin from "../../../../../config/firebase-admin"
import { buildAuthErrorResponse, requireAdmin } from "../../_utils/auth"

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return buildAuthErrorResponse(auth)
  }

  try {
    // Get all ASSIGNED orders (active deliveries)
    const ordersSnap = await admin
      .firestore()
      .collection("orders")
      .where("status", "in", ["ASSIGNED"])
      .get()

    if (ordersSnap.empty) {
      return new Response(JSON.stringify({ orders: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Collect unique driver/customer IDs
    const driverIds = new Set<string>()
    const customerIds = new Set<string>()
    for (const doc of ordersSnap.docs) {
      const data = doc.data()
      if (data.driverId) driverIds.add(data.driverId as string)
      if (data.customerId) customerIds.add(data.customerId as string)
    }

    // Fetch user names
    const allUserIds = [...new Set([...driverIds, ...customerIds])]
    const userNames: Record<string, string> = {}
    // Firestore "in" queries max 30 elements at a time
    for (let i = 0; i < allUserIds.length; i += 30) {
      const batch = allUserIds.slice(i, i + 30)
      const usersSnap = await admin.firestore().collection("users").where("__name__", "in", batch).get()
      for (const doc of usersSnap.docs) {
        const data = doc.data()
        userNames[doc.id] = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() || "N/A"
      }
    }

    // Fetch driver locations from Realtime DB
    const driverLocations: Record<string, { lat: number; lng: number }> = {}
    const locationPromises = [...driverIds].map(async (driverId) => {
      try {
        const snapshot = await admin.database().ref(`drivers/${driverId}/location`).once("value")
        const val = snapshot.val()
        if (val && typeof val.lat === "number" && typeof val.lng === "number") {
          driverLocations[driverId] = { lat: val.lat, lng: val.lng }
        }
      } catch {
        // Driver location not available
      }
    })
    await Promise.all(locationPromises)

    // Build response
    const orders = ordersSnap.docs
      .map((doc) => {
        const data = doc.data()
        const driverId = (data.driverId as string) ?? ""
        const customerId = (data.customerId as string) ?? ""
        const driverLoc = driverLocations[driverId]
        const dropoff = data.dropoff as { address?: string; lat?: number; lng?: number } | undefined

        return {
          orderId: doc.id,
          status: data.status as string,
          driverId,
          driverName: userNames[driverId] ?? "N/A",
          driverLat: driverLoc?.lat ?? 0,
          driverLng: driverLoc?.lng ?? 0,
          dropoffLat: dropoff?.lat ?? 0,
          dropoffLng: dropoff?.lng ?? 0,
          dropoffAddress: dropoff?.address ?? "",
          customerName: userNames[customerId] ?? "N/A",
        }
      })
      .filter((o) => o.driverLat !== 0 || o.driverLng !== 0 || o.dropoffLat !== 0 || o.dropoffLng !== 0)

    return new Response(JSON.stringify({ orders }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[GET /api/orders/active] Error:", error)
    return new Response(JSON.stringify({ error: "Impossible de charger les commandes actives" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
