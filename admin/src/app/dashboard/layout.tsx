"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../context/AuthContext"

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/")
    }
  }, [user, isAdmin, loading, router])

  if (loading || !isAdmin) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h1>Vérification des droits administrateur...</h1>
      </div>
    )
  }

  return <>{children}</>
}