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
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Dashboard Admin</h1>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => router.push('/dashboard/users')}
          style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.6rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        >
          Gérer les utilisateurs
        </button>
        <button
          onClick={() => router.push('/dashboard/products')}
          style={{ backgroundColor: '#059669', color: 'white', padding: '0.6rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#047857'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#059669'}
        >
          Gérer les produits
        </button>
      </div>

      <button
        onClick={handleLogout}
        style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.6rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
      >
        Déconnexion
      </button>
    </div>
  )
}
