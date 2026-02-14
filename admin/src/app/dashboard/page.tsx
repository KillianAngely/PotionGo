"use client"
import { useRouter } from "next/navigation"
import { useAuth } from "../00_INFRA/Context/AuthContext"

export default function Dashboard() {
  const router = useRouter()
  const { logout, loading } = useAuth()

  if (loading) {
    return <div>Chargement...</div>
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.log("Erreur lors de la déconnexion:", error)
    }
  }

  return (
    <div>
      <h1>Dashboard Admin</h1>
      <button onClick={handleLogout}>Déconnexion</button>
    </div>
  )
}
