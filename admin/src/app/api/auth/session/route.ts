import admin from "../../../../../config/firebase-admin"
import { NextResponse } from "next/server"
import { z } from "zod"
import { AUTH_COOKIE_NAME, getCookieValue, SESSION_MAX_AGE_SECONDS } from "../../_utils/auth"
import { generateCsrfToken, requireCsrf } from "../../_utils/csrf"

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
    const csrfError = requireCsrf(request)
    if (csrfError) {
      return csrfError
    }

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

    if (String(decoded.role).toUpperCase() !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Accès interdit" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    const remainingSessionSeconds = getRemainingSessionSeconds(decoded)

    if (remainingSessionSeconds <= 0) {
      const response = NextResponse.json(
        { error: "Session expirée, veuillez vous reconnecter" },
        { status: 401 },
      )
      response.cookies.delete(AUTH_COOKIE_NAME)
      response.cookies.delete("csrfToken")
      return response
    }

    const sessionCookie = await admin.auth().createSessionCookie(idToken, {
      expiresIn: remainingSessionSeconds * 1000,
    })

    const csrfToken = generateCsrfToken()
    const response = NextResponse.json({ success: true, csrfToken }, { status: 200 })

    // Set cookies using NextResponse API
    response.cookies.set(AUTH_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: remainingSessionSeconds,
      path: "/",
    })

    response.cookies.set("csrfToken", csrfToken, {
      httpOnly: false, // MUST be false so JavaScript can read it
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: remainingSessionSeconds,
      path: "/",
    })

    return response
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
    const csrfError = requireCsrf(request)
    if (csrfError) {
      return csrfError
    }

    const sessionCookie = getCookieValue(request.headers.get("cookie"), AUTH_COOKIE_NAME)
    if (sessionCookie) {
      try {
        const decoded = await admin.auth().verifySessionCookie(sessionCookie)
        await admin.auth().revokeRefreshTokens(decoded.uid)
      } catch (error) {
        console.warn("[DELETE /api/auth/session] revoke session skipped:", error)
      }
    }

    const response = NextResponse.json({ success: true }, { status: 200 })

    // Clear cookies using NextResponse API
    response.cookies.delete(AUTH_COOKIE_NAME)
    response.cookies.delete("csrfToken")

    return response
  } catch (error) {
    console.error("[DELETE /api/auth/session] Error:", error)
    return new Response(JSON.stringify({ error: "Impossible de supprimer la session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
