"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../00_INFRA/Context/AuthContext"

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
      <div className="flex min-h-screen items-center justify-center bg-bg text-fg">
        <div className="rounded-2xl border border-border bg-card/80 px-6 py-5 shadow-glow">
          <h1 className="text-lg font-semibold">Vérification des droits administrateur...</h1>
          <p className="mt-2 text-sm text-muted">Chargement du panneau sécurisé.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              PotionGo Admin
            </p>
            <h1 className="text-2xl font-semibold">Tableau de bord</h1>
            <p className="text-sm text-muted">
              Contrôle global, utilisateurs et produits en un seul endroit.
            </p>
          </div>
        </header>
        <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-glow">
          {children}
        </div>
      </div>
    </div>
  )
}
