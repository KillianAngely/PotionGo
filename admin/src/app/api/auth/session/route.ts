import admin from "../../../../../config/firebase-admin"
import { z } from "zod"
import {
  buildClearSessionCookie,
  buildSessionCookie,
} from "../../_utils/auth"

export const runtime = "nodejs"

const sessionSchema = z.object({
  idToken: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = sessionSchema.safeParse(body)
    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Données invalides" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { idToken } = validation.data
    let decoded: admin.auth.DecodedIdToken
    try {
      decoded = await admin.auth().verifyIdToken(idToken)
    } catch (error) {
      console.error("[POST /api/auth/session] verifyIdToken error:", error)
      return new Response(JSON.stringify({ error: "Token invalide" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (decoded.role !== "admin") {
      return new Response(JSON.stringify({ error: "Accès interdit" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    const headers = new Headers({ "Content-Type": "application/json" })
    headers.append("Set-Cookie", buildSessionCookie(idToken, 60 * 60))

    return new Response(JSON.stringify({ success: true }), { status: 200, headers })
  } catch (error) {
    console.error("[POST /api/auth/session] Error:", error)
    const message =
      process.env.NODE_ENV === "production"
        ? "Impossible de créer la session"
        : `Impossible de créer la session: ${error instanceof Error ? error.message : String(error)}`
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function DELETE() {
  try {
    const headers = new Headers({ "Content-Type": "application/json" })
    headers.append("Set-Cookie", buildClearSessionCookie())
    return new Response(JSON.stringify({ success: true }), { status: 200, headers })
  } catch (error) {
    console.error("[DELETE /api/auth/session] Error:", error)
    return new Response(JSON.stringify({ error: "Impossible de supprimer la session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
