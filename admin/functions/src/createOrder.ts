import { onCall, HttpsError } from "firebase-functions/v2/https"
import { z } from "zod"
import { firestore } from "firebase-admin"
import { getDatabase } from "firebase-admin/database"
import { getMessaging } from "firebase-admin/messaging"

const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        potionId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  dropoff: z.object({
    address: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
  }),
})

function generateValidationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const NEARBY_RADIUS_KM = 10
const LOCATION_FRESHNESS_MS = 5 * 60 * 1000

export const createOrder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in")
  }

  if (request.auth.token.role !== "customer") {
    throw new HttpsError("permission-denied", "Only customers can create orders")
  }

  const result = CreateOrderSchema.safeParse(request.data)
  if (!result.success) {
    throw new HttpsError("invalid-argument", result.error.message)
  }

  const { items, dropoff } = result.data
  const validationCode = generateValidationCode()

  try {
    const orderData = {
      customerId: request.auth.uid,
      driverId: null,
      driverStart: null,
      dropoff,
      items,
      status: "PENDING",
      validationCode,
      createdAt: firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await firestore().collection("orders").add(orderData)

    const driversSnapshot = await getDatabase().ref("drivers").get()
    const nearbyDriverTokens: string[] = []

    if (driversSnapshot.exists()) {
      const driversData = driversSnapshot.val() as Record<
        string,
        { location?: { lat: number; lng: number; timestamp: number } }
      >

      const now = Date.now()

      for (const [driverId, driverData] of Object.entries(driversData)) {
        if (!driverData.location) continue

        const { lat, lng, timestamp } = driverData.location
        if (now - timestamp > LOCATION_FRESHNESS_MS) continue

        const distance = haversineDistance(lat, lng, dropoff.lat, dropoff.lng)
        if (distance > NEARBY_RADIUS_KM) continue

        const userDoc = await firestore().collection("users").doc(driverId).get()
        const fcmToken = userDoc.data()?.fcmToken
        if (fcmToken) {
          nearbyDriverTokens.push(fcmToken)
        }
      }
    }

    if (nearbyDriverTokens.length > 0) {
      await getMessaging().sendEachForMulticast({
        tokens: nearbyDriverTokens,
        data: {
          type: "NEW_ORDER",
          orderId: docRef.id,
          dropoffAddress: dropoff.address,
          dropoffLat: dropoff.lat.toString(),
          dropoffLng: dropoff.lng.toString(),
          itemCount: items.length.toString(),
        },
        notification: {
          title: "Nouvelle commande disponible",
          body: `${items.length} article(s) - ${dropoff.address}`,
        },
        android: {
          priority: "high",
        },
      })
    }

    return {
      success: true,
      orderId: docRef.id,
      validationCode,
    }
  } catch (error) {
    console.error("createOrder error:", error)
    throw new HttpsError("internal", "Server error")
  }
})
