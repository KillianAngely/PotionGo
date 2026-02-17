import { onCall, HttpsError } from "firebase-functions/v2/https"
import { z } from "zod"
import { firestore } from "firebase-admin"

const SubmitRatingSchema = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

export const submitRating = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in")
  }

  const result = SubmitRatingSchema.safeParse(request.data)
  if (!result.success) {
    throw new HttpsError("invalid-argument", result.error.message)
  }

  const { orderId, rating, comment } = result.data
  const uid = request.auth.uid
  const db = firestore()

  try {
    // Get order
    const orderDoc = await db.collection("orders").doc(orderId).get()
    if (!orderDoc.exists) {
      throw new HttpsError("not-found", "Order not found")
    }

    const order = orderDoc.data()!
    if (order.status !== "DELIVERED") {
      throw new HttpsError("failed-precondition", "Order is not delivered")
    }

    // Determine reviewer and reviewee
    const isCustomer = order.customerId === uid
    const isDriver = order.driverId === uid

    if (!isCustomer && !isDriver) {
      throw new HttpsError("permission-denied", "You are not part of this order")
    }

    const reviewerRole = isCustomer ? "CUSTOMER" : "DRIVER"
    const revieweeId = isCustomer ? order.driverId : order.customerId
    const revieweeRole = isCustomer ? "DRIVER" : "CUSTOMER"

    if (!revieweeId) {
      throw new HttpsError("failed-precondition", "No reviewee found for this order")
    }

    // Check for duplicate
    const existing = await db
      .collection("ratings")
      .where("orderId", "==", orderId)
      .where("reviewerId", "==", uid)
      .limit(1)
      .get()

    if (!existing.empty) {
      throw new HttpsError("already-exists", "You have already rated this order")
    }

    // Create rating
    await db.collection("ratings").add({
      orderId,
      reviewerId: uid,
      reviewerRole,
      revieweeId,
      revieweeRole,
      rating,
      comment: comment || null,
      createdAt: firestore.FieldValue.serverTimestamp(),
    })

    // Recalculate reviewee's average rating
    const allRatings = await db.collection("ratings").where("revieweeId", "==", revieweeId).get()

    let totalRatings = 0
    let sumRatings = 0
    allRatings.forEach((doc) => {
      totalRatings++
      sumRatings += doc.data().rating as number
    })

    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0

    await db
      .collection("users")
      .doc(revieweeId)
      .update({
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
      })

    return { success: true }
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error
    }
    console.error(error)
    throw new HttpsError("internal", "Server error")
  }
})
