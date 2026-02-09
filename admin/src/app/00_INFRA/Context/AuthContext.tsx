"use client"
import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { auth } from '../../../../config/firebase'
import { onAuthStateChanged } from 'firebase/auth'

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const tokenResult = await currentUser.getIdTokenResult()

        if (tokenResult.claims.role === 'admin') {
          setUser(currentUser)
          setIsAdmin(true)
          const idToken = await currentUser.getIdToken(true)
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ idToken }),
          })
          if (!response.ok) {
            setIsAdmin(false)
            await auth.signOut()
          }
        } else {
          setUser(currentUser)
          setIsAdmin(false)
          await fetch("/api/auth/session", { method: "DELETE", credentials: "include" })
          await auth.signOut()
        }
      } else {
        setUser(null)
        setIsAdmin(false)
        await fetch("/api/auth/session", { method: "DELETE", credentials: "include" })
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE", credentials: "include" })
      await auth.signOut()
      setUser(null)
      setIsAdmin(false)
    } catch (error) {
      throw error
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
    throw new Error('useAuth doit être utilisé dans AuthProvider')
  }
  return context
}
