import admin from "../../../../config/firebase-admin"

const AUTH_COOKIE_NAME = "authToken"
const ADMIN_ROLE_VALUE = "admin"

type AuthResult =
  | { ok: true; decoded: admin.auth.DecodedIdToken }
  | { ok: false; status: number; error: string }

const getCookieValue = (cookieHeader: string | null, name: string) => {
  if (!cookieHeader) return null
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  if (!match) return null
  return decodeURIComponent(match.slice(name.length + 1))
}

const getTokenFromRequest = (request: Request) => {
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length)
  }

  return getCookieValue(request.headers.get("cookie"), AUTH_COOKIE_NAME)
}

export const requireAdmin = async (request: Request): Promise<AuthResult> => {
  const token = getTokenFromRequest(request)
  if (!token) {
    return { ok: false, status: 401, error: "Non autorisé" }
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    if (decoded.role !== ADMIN_ROLE_VALUE) {
      return { ok: false, status: 403, error: "Accès interdit" }
    }
    return { ok: true, decoded }
  } catch {
    return { ok: false, status: 401, error: "Token invalide" }
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
