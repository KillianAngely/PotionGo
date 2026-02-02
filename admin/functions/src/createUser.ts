import { onCall, HttpsError } from "firebase-functions/v2/https"
import { getAuth } from "firebase-admin/auth"
import { z } from "zod"
import { firestore } from "firebase-admin"

const RoleSchema = z.object({
  role: z.enum(["driver", "customer"]),
  email: z.email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

export const createUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in")
  }

  const result = RoleSchema.safeParse(request.data)
  if (!result.success) {
    throw new HttpsError("invalid-argument", result.error.message)
  }

  const { role, email, firstName, lastName } = result.data

  try {
    await getAuth().setCustomUserClaims(request.auth.uid, { role })

    await firestore().collection("users").doc(request.auth.uid).set(
      {
        firstName,
        lastName,
        email,
        role,
      },
      { merge: true },
    )

    return { success: true }
  } catch (error) {
    console.error(error)
    await getAuth()
      .deleteUser(request.auth.uid)
      .catch((err) => {
        console.error("Failed to delete user after Firestore error:", err)
      })
    throw new HttpsError("internal", "Server error")
  }
})
