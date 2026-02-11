import { randomBytes } from "crypto"
import { AUTH_COOKIE_NAME, buildClearSessionCookie, getCookieValue } from "./auth"

export const CSRF_COOKIE_NAME = "csrfToken"

const secureFlag = process.env.NODE_ENV === "production" ? " Secure;" : ""

export const generateCsrfToken = () => randomBytes(32).toString("hex")

export const buildCsrfCookie = (token: string, maxAgeSeconds: number) => {
  return `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Strict;${secureFlag}`
}

export const buildClearCsrfCookie = () => {
  return `${CSRF_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Strict;${secureFlag}`
}

const getSessionCookieFromRequest = (request: Request) =>
  getCookieValue(request.headers.get("cookie"), AUTH_COOKIE_NAME)

export const verifyCsrfToken = (request: Request) => {
  const csrfCookie = getCookieValue(request.headers.get("cookie"), CSRF_COOKIE_NAME)
  const csrfHeader = request.headers.get("x-csrf-token")
  if (!csrfCookie || !csrfHeader) return false
  return csrfCookie === csrfHeader
}

export const requireCsrf = (request: Request) => {
  const hasSession = Boolean(getSessionCookieFromRequest(request))
  if (!hasSession) return null

  if (verifyCsrfToken(request)) return null

  const headers = new Headers({ "Content-Type": "application/json" })
  headers.append("Set-Cookie", buildClearSessionCookie())
  headers.append("Set-Cookie", buildClearCsrfCookie())
  return new Response(JSON.stringify({ error: "CSRF invalide" }), {
    status: 403,
    headers,
  })
}
