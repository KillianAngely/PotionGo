import { onCall, HttpsError } from "firebase-functions/v2/https"
import { z } from "zod"
import { firestore } from "firebase-admin"

const ValidateOrderSchema = z.object({
  orderId: z.string().min(1),
  validationCode: z.string().length(6),
})

export const validateOrder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in")
  }

  if (request.auth.token.role !== "driver") {
    throw new HttpsError("permission-denied", "Only drivers can validate orders")
  }

  const result = ValidateOrderSchema.safeParse(request.data)
  if (!result.success) {
    throw new HttpsError("invalid-argument", result.error.message)
  }

  const { orderId, validationCode } = result.data
  const driverId = request.auth.uid

  try {
    const orderRef = firestore().collection("orders").doc(orderId)
    const orderDoc = await orderRef.get()

    if (!orderDoc.exists) {
      throw new HttpsError("not-found", "Order not found")
    }

    const orderData = orderDoc.data()!

    if (orderData.driverId !== driverId) {
      throw new HttpsError(
        "permission-denied",
        "Vous n'etes pas le livreur de cette commande",
      )
    }

    if (orderData.status !== "ASSIGNED" && orderData.status !== "IN_TRANSIT") {
      throw new HttpsError(
        "failed-precondition",
        "Cette commande ne peut pas etre validee",
      )
    }

    if (orderData.validationCode !== validationCode) {
      throw new HttpsError("invalid-argument", "Code de validation incorrect")
    }

    await orderRef.update({
      status: "DELIVERED",
    })

    return { success: true }
  } catch (error) {
    if (error instanceof HttpsError) throw error
    console.error("validateOrder error:", error)
    throw new HttpsError("internal", "Server error")
  }
})
