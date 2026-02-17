import { onCall, HttpsError } from "firebase-functions/v2/https"
import { z } from "zod"
import { firestore } from "firebase-admin"

const RejectOrderSchema = z.object({
  orderId: z.string().min(1),
})

export const rejectOrder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in")
  }

  if (request.auth.token.role !== "driver") {
    throw new HttpsError("permission-denied", "Only drivers can reject orders")
  }

  const result = RejectOrderSchema.safeParse(request.data)
  if (!result.success) {
    throw new HttpsError("invalid-argument", result.error.message)
  }

  const { orderId } = result.data
  const driverId = request.auth.uid

  try {
    const orderRef = firestore().collection("orders").doc(orderId)
    const orderDoc = await orderRef.get()

    if (!orderDoc.exists) {
      throw new HttpsError("not-found", "Order not found")
    }

    const orderData = orderDoc.data()!
    if (orderData.status !== "PENDING") {
      throw new HttpsError("failed-precondition", "Cette commande n'est plus disponible")
    }

    await orderRef.update({
      rejectedBy: firestore.FieldValue.arrayUnion(driverId),
    })

    return { success: true }
  } catch (error) {
    if (error instanceof HttpsError) throw error
    console.error("rejectOrder error:", error)
    throw new HttpsError("internal", "Server error")
  }
})
