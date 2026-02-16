import { onCall, HttpsError } from "firebase-functions/v2/https"
import { z } from "zod"
import { firestore } from "firebase-admin"
import { getDatabase } from "firebase-admin/database"

const AcceptOrderSchema = z.object({
  orderId: z.string().min(1),
})

export const acceptOrder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in")
  }

  if (request.auth.token.role !== "driver") {
    throw new HttpsError("permission-denied", "Only drivers can accept orders")
  }

  const result = AcceptOrderSchema.safeParse(request.data)
  if (!result.success) {
    throw new HttpsError("invalid-argument", result.error.message)
  }

  const { orderId } = result.data
  const driverId = request.auth.uid

  try {
    const driverLocSnap = await getDatabase()
      .ref(`drivers/${driverId}/location`)
      .get()
    const driverLoc = driverLocSnap.exists() ? driverLocSnap.val() : null

    await firestore().runTransaction(async (transaction) => {
      const orderRef = firestore().collection("orders").doc(orderId)
      const orderDoc = await transaction.get(orderRef)

      if (!orderDoc.exists) {
        throw new HttpsError("not-found", "Order not found")
      }

      const orderData = orderDoc.data()!
      if (orderData.status !== "PENDING") {
        throw new HttpsError(
          "failed-precondition",
          "Cette commande a deja ete prise en charge",
        )
      }

      transaction.update(orderRef, {
        driverId,
        status: "ASSIGNED",
        driverStart: driverLoc
          ? { lat: driverLoc.lat, lng: driverLoc.lng }
          : null,
      })
    })

    return { success: true }
  } catch (error) {
    if (error instanceof HttpsError) throw error
    console.error("acceptOrder error:", error)
    throw new HttpsError("internal", "Server error")
  }
})
