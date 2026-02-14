import { onCall, HttpsError } from "firebase-functions/https"

export const createOrder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in")
  }
  return { success: true }
})
