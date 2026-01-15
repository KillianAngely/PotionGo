"use client"
import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { auth } from '../../config/firebase'
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
        console.log('Utilisateur connecté:', currentUser.email)
        const tokenResult = await currentUser.getIdTokenResult()
        console.log('Token result claims:', tokenResult.claims)
        console.log('Rôle utilisateur:', tokenResult.claims.role)
        
        if (tokenResult.claims.role === 'admin') {
          console.log('admin confirm')
          setUser(currentUser)
          setIsAdmin(true)
          const idToken = await currentUser.getIdToken()
          document.cookie = `authToken=${idToken}; path=/; max-age=3600; Secure; SameSite=Strict`
        } else {
          console.log('Utilisateur non admin', tokenResult.claims.role)
          setUser(currentUser)
          setIsAdmin(false)
          await auth.signOut()
        }
      } else {
        console.log('Utilisateur déconnecté')
        setUser(null)
        setIsAdmin(false)
        document.cookie = 'authToken=; path=/; max-age=0; Secure; SameSite=Strict'
        console.log('Cookie authToken supprimé')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    try {
      await auth.signOut()
      setUser(null)
      setIsAdmin(false)
      document.cookie = 'authToken=; path=/; max-age=0; Secure; SameSite=Strict'
    } catch (error) {
      console.log('Erreur lors de la déconnexion:', error)
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