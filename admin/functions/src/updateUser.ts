import { onCall, HttpsError } from "firebase-functions/v2/https"
import { getAuth } from "firebase-admin/auth"
import { z } from "zod"
import { firestore } from "firebase-admin"

const UpdateUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
})

export const updateUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in")
  }

  const result = UpdateUserSchema.safeParse(request.data)
  if (!result.success) {
    throw new HttpsError("invalid-argument", result.error.message)
  }

  const { firstName, lastName, email } = result.data
  const uid = request.auth.uid

  try {
    const userDoc = await firestore().collection("users").doc(uid).get()
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found")
    }

    const currentData = userDoc.data()
    const currentEmail = currentData?.email as string | undefined
    const emailChanged = !!email && email !== currentEmail

    const firestoreUpdate: Record<string, string> = {
      firstName,
      lastName,
    }

    if (email) {
      firestoreUpdate.email = email
    }

    await firestore().collection("users").doc(uid).update(firestoreUpdate)

    if (emailChanged) {
      await getAuth().updateUser(uid, {
        email,
        emailVerified: false,
      })
    }

    return { success: true, emailChanged }
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error
    }
    console.error(error)
    throw new HttpsError("internal", "Server error")
  }
})
