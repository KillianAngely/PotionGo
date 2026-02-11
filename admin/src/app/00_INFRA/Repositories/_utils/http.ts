export const SESSION_EXPIRED_EVENT = "auth:session-expired"
const SESSION_EXPIRED_MESSAGE = "Session expirée, veuillez vous reconnecter"

let isSessionExpiryHandlingInProgress = false

const triggerSessionExpiredFlow = () => {
  if (typeof window === "undefined" || isSessionExpiryHandlingInProgress) return
  isSessionExpiryHandlingInProgress = true
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  window.location.replace("/")
}

const readErrorMessage = async (response: Response, fallbackMessage: string) => {
  const data = await response.json().catch(() => null)
  if (data && typeof data === "object" && "error" in data) {
    const message = (data as { error?: unknown }).error
    if (typeof message === "string" && message.trim()) {
      return message
    }
  }
  return fallbackMessage
}

export const assertApiResponse = async (response: Response, fallbackMessage: string) => {
  if (response.status === 401) {
    triggerSessionExpiredFlow()
    throw new Error(SESSION_EXPIRED_MESSAGE)
  }

  if (!response.ok) {
    const message = await readErrorMessage(response, fallbackMessage)
    throw new Error(message)
  }
}
