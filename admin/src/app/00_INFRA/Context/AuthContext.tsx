"use client"
import { createContext, useContext, ReactNode, useState, useEffect } from "react"
import { User } from "firebase/auth"
import { auth } from "../../../../config/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { SESSION_EXPIRED_EVENT, withCsrfHeaders } from "../Repositories/_utils/http"

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const clearServerSession = async () => {
      try {
        await fetch("/api/auth/session", {
          method: "DELETE",
          credentials: "include",
          headers: withCsrfHeaders(),
        })
      } catch (error) {
        console.error("Session cleanup failed:", error)
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const tokenResult = await currentUser.getIdTokenResult()

          if (tokenResult.claims.role === "admin") {
            const idToken = await currentUser.getIdToken(true)
            const response = await fetch("/api/auth/session", {
              method: "POST",
              headers: withCsrfHeaders({ "Content-Type": "application/json" }),
              credentials: "include",
              body: JSON.stringify({ idToken }),
            })
            if (response.ok) {
              setUser(currentUser)
              setIsAdmin(true)
            } else {
              setUser(null)
              setIsAdmin(false)
              await auth.signOut()
            }
          } else {
            setUser(null)
            setIsAdmin(false)
            await clearServerSession()
            await auth.signOut()
          }
        } else {
          setUser(null)
          setIsAdmin(false)
          await clearServerSession()
        }
      } catch (error) {
        console.error("Auth state initialization failed:", error)
        setUser(null)
        setIsAdmin(false)
        await clearServerSession()
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const handleSessionExpired = async () => {
      setUser(null)
      setIsAdmin(false)
      try {
        await auth.signOut()
      } catch (error) {
        console.error("Client signOut after session expiry failed:", error)
      }
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  }, [])

  const logout = async () => {
    let failed = false
    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "include",
        headers: withCsrfHeaders(),
      })
    } catch (error) {
      failed = true
      console.error("Server logout failed:", error)
    } finally {
      await auth.signOut()
      setUser(null)
      setIsAdmin(false)
    }

    if (failed) {
      throw new Error("Déconnexion partielle: session locale fermée, nettoyage serveur en échec")
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans AuthProvider")
  }
  return context
}
