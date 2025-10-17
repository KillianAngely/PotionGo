import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "../../../../../config/firebase"
import { error } from "console"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validation des données
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          error: "Email et mot de passe requis",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Création de l'utilisateur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {}
  return new Response(
    JSON.stringify({
      error: "Erreur lors de l'inscription",
    }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  )
}
