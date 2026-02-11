import admin from "../../../../../config/firebase-admin"
import { z } from "zod"
import {
  AUTH_COOKIE_NAME,
  buildClearSessionCookie,
  buildSessionCookie,
  getCookieValue,
  SESSION_MAX_AGE_SECONDS,
} from "../../_utils/auth"

export const runtime = "nodejs"

const sessionSchema = z.object({
  idToken: z.string().min(1),
})

const getRemainingSessionSeconds = (decoded: admin.auth.DecodedIdToken) => {
  const authTimeSeconds = Number(decoded.auth_time)
  if (!Number.isFinite(authTimeSeconds)) return 0

  const nowSeconds = Math.floor(Date.now() / 1000)
  return Math.max(0, authTimeSeconds + SESSION_MAX_AGE_SECONDS - nowSeconds)
}

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
      decoded = await admin.auth().verifyIdToken(idToken, true)
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

    const remainingSessionSeconds = getRemainingSessionSeconds(decoded)
    if (remainingSessionSeconds <= 0) {
      const headers = new Headers({ "Content-Type": "application/json" })
      headers.append("Set-Cookie", buildClearSessionCookie())
      return new Response(JSON.stringify({ error: "Session expirée, veuillez vous reconnecter" }), {
        status: 401,
        headers,
      })
    }

    const sessionCookie = await admin.auth().createSessionCookie(idToken, {
      expiresIn: remainingSessionSeconds * 1000,
    })
    const headers = new Headers({ "Content-Type": "application/json" })
    headers.append("Set-Cookie", buildSessionCookie(sessionCookie, remainingSessionSeconds))

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

export async function DELETE(request: Request) {
  try {
    const sessionCookie = getCookieValue(request.headers.get("cookie"), AUTH_COOKIE_NAME)
    if (sessionCookie) {
      try {
        const decoded = await admin.auth().verifySessionCookie(sessionCookie)
        await admin.auth().revokeRefreshTokens(decoded.uid)
      } catch (error) {
        console.warn("[DELETE /api/auth/session] revoke session skipped:", error)
      }
    }

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
