import admin from "../../../../../config/firebase-admin"
import { schema } from "./schema"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Données invalides",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const { email, password, role } = result.data

    const userCredential = await admin.auth().createUser({
      email,
      password,
    })

    await admin.auth().setCustomUserClaims(userCredential.uid, { role })

    await admin.firestore().collection("users").doc(userCredential.uid).set({
      email,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log(`[SIGNUP] New user created: ${userCredential.uid}`)

    const token = await admin.auth().createCustomToken(userCredential.uid, { role })

    return new Response(
      JSON.stringify({
        success: true,
        token,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
