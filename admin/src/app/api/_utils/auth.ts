import admin from "../../../../config/firebase-admin"
import { buildClearCsrfCookie } from "./csrf"

export const AUTH_COOKIE_NAME = "authToken"
const ADMIN_ROLE_VALUE = "admin"
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60

type AuthSuccess = { ok: true; decoded: admin.auth.DecodedIdToken }
type AuthFailure = {
  ok: false
  status: number
  error: string
  clearSessionCookie?: boolean
}
type AuthResult = AuthSuccess | AuthFailure

export const getCookieValue = (cookieHeader: string | null, name: string) => {
  if (!cookieHeader) return null
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  if (!match) return null
  return decodeURIComponent(match.slice(name.length + 1))
}

const getBearerTokenFromRequest = (request: Request) => {
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length)
  }
  return null
}

const getSessionCookieFromRequest = (request: Request) => {
  return getCookieValue(request.headers.get("cookie"), AUTH_COOKIE_NAME)
}

export const requireAdmin = async (request: Request): Promise<AuthResult> => {
  const sessionCookie = getSessionCookieFromRequest(request)
  const bearerToken = getBearerTokenFromRequest(request)
  if (!sessionCookie && !bearerToken) {
    return { ok: false, status: 401, error: "Non autorisé" }
  }

  try {
    let decoded: admin.auth.DecodedIdToken
    if (sessionCookie) {
      decoded = await admin.auth().verifySessionCookie(sessionCookie, true)
    } else if (bearerToken) {
      decoded = await admin.auth().verifyIdToken(bearerToken, true)
    } else {
      return { ok: false, status: 401, error: "Non autorisé" }
    }

    if (decoded.role !== ADMIN_ROLE_VALUE) {
      return { ok: false, status: 403, error: "Accès interdit" }
    }
    return { ok: true, decoded }
  } catch (error: unknown) {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : null
    if (errorCode === "auth/session-cookie-expired") {
      return {
        ok: false,
        status: 401,
        error: "Session expirée, veuillez vous reconnecter",
        clearSessionCookie: true,
      }
    }
    return {
      ok: false,
      status: 401,
      error: "Token invalide",
      clearSessionCookie: Boolean(sessionCookie),
    }
  }
}

export const buildSessionCookie = (token: string, maxAgeSeconds: number) => {
  const secureFlag = process.env.NODE_ENV === "production" ? " Secure;" : ""
  return `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Strict;${secureFlag}`
}

export const buildClearSessionCookie = () => {
  const secureFlag = process.env.NODE_ENV === "production" ? " Secure;" : ""
  return `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict;${secureFlag}`
}

export const buildAuthErrorResponse = (auth: AuthFailure) => {
  const headers = new Headers({ "Content-Type": "application/json" })
  if (auth.status === 401 && auth.clearSessionCookie) {
    headers.append("Set-Cookie", buildClearSessionCookie())
    headers.append("Set-Cookie", buildClearCsrfCookie())
  }

  return new Response(JSON.stringify({ error: auth.error }), {
    status: auth.status,
    headers,
  })
}
