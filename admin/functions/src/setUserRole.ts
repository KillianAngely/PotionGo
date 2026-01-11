import { onCall, HttpsError } from "firebase-functions/v2/https"
import { getAuth } from "firebase-admin/auth"
import { z } from "zod"

const RoleSchema = z.object({
  role: z.enum(["driver", "customer"]),
})

export const setUserRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in")
  }

  const result = RoleSchema.safeParse(request.data)
  if (!result.success) {
    throw new HttpsError("invalid-argument", result.error.message)
  }

  const { role } = result.data

  try {
    await getAuth().setCustomUserClaims(request.auth.uid, { role })
    return { success: true, role }
  } catch (error) {
    console.error(error)
    throw new HttpsError("internal", "Server error")
  }
})
