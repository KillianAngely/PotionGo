"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../00_INFRA/Context/AuthContext"

type DashboardStats = {
  totals: { users: number; products: number; orders: number }
  roles: Record<string, number>
  orderStatuses: Record<string, number>
  estimatedUnitsSold: number
}

const toChartData = (record: Record<string, number>) =>
  Object.entries(record).sort((a, b) => b[1] - a[1])

export default function Dashboard() {
  const router = useRouter()
  const { logout, loading } = useAuth()
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true)
      setStatsError(null)
      try {
        const response = await fetch("/api/dashboard/stats", { credentials: "include" })
        if (!response.ok) {
          throw new Error("Impossible de charger les statistiques")
        }
        const data = await response.json()
        setStats({
          totals: data.totals,
          roles: data.roles,
          orderStatuses: data.orderStatuses,
          estimatedUnitsSold: data.estimatedUnitsSold,
        })
      } catch (error) {
        setStatsError(error instanceof Error ? error.message : "Erreur de chargement")
      } finally {
        setStatsLoading(false)
      }
    }

    loadStats()
  }, [])

  const roleData = useMemo(() => toChartData(stats?.roles ?? {}), [stats])
  const statusData = useMemo(() => toChartData(stats?.orderStatuses ?? {}), [stats])

  if (loading) {
    return <div>Chargement...</div>
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch {
      router.push("/")
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-border bg-bg/80 p-6">
        <h2 className="text-lg font-semibold">Accès rapide</h2>
        <p className="mt-1 text-sm text-muted">Choisis un module pour gérer les données principales.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button onClick={() => router.push("/dashboard/users")} className="group rounded-2xl border border-border bg-card px-5 py-4 text-left shadow-glow transition hover:-translate-y-1 hover:border-accent/60">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Utilisateurs</p>
            <h3 className="mt-2 text-lg font-semibold">Gérer les comptes</h3>
            <p className="mt-2 text-sm text-muted">Parcourir, filtrer et consulter les profils.</p>
          </button>
          <button onClick={() => router.push("/dashboard/orders")} className="group rounded-2xl border border-border bg-card px-5 py-4 text-left shadow-glow transition hover:-translate-y-1 hover:border-accent/60">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Commandes</p>
            <h3 className="mt-2 text-lg font-semibold">Suivre les livraisons</h3>
            <p className="mt-2 text-sm text-muted">Statuts, clients et détails de livraison.</p>
          </button>
          <button onClick={() => router.push("/dashboard/products")} className="group rounded-2xl border border-border bg-card px-5 py-4 text-left shadow-glow transition hover:-translate-y-1 hover:border-accent/60">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Produits</p>
            <h3 className="mt-2 text-lg font-semibold">Suivre les potions</h3>
            <p className="mt-2 text-sm text-muted">Inventaire, mood et détails des offres.</p>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Stats</h3>
          {statsLoading && <span className="text-sm text-muted">Chargement...</span>}
        </div>

        {statsError && <p className="mt-3 text-sm text-red-500">{statsError}</p>}

        {stats && (
          <div className="mt-5 grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-bg/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Totaux</p>
              <div className="mt-3 grid gap-2 text-sm">
                <p>Utilisateurs: <strong>{stats.totals.users}</strong></p>
                <p>Produits: <strong>{stats.totals.products}</strong></p>
                <p>Commandes: <strong>{stats.totals.orders}</strong></p>
                <p>Unités vendues (estimé): <strong>{stats.estimatedUnitsSold}</strong></p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-bg/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Répartition des rôles</p>
              <div className="mt-3 space-y-2">
                {roleData.length === 0 ? (
                  <p className="text-sm text-muted">Aucune donnée</p>
                ) : (
                  roleData.map(([label, value]) => {
                    const max = roleData[0]?.[1] || 1
                    const width = `${Math.max(8, Math.round((value / max) * 100))}%`
                    return (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-xs text-muted">
                          <span>{label}</span>
                          <span>{value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-border/70">
                          <div className="h-2 rounded-full bg-accent" style={{ width }} />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-bg/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Statut des commandes</p>
              <div className="mt-3 space-y-2">
                {statusData.length === 0 ? (
                  <p className="text-sm text-muted">Aucune donnée</p>
                ) : (
                  statusData.map(([label, value]) => {
                    const max = statusData[0]?.[1] || 1
                    const width = `${Math.max(8, Math.round((value / max) * 100))}%`
                    return (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-xs text-muted">
                          <span>{label}</span>
                          <span>{value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-border/70">
                          <div className="h-2 rounded-full bg-accent2" style={{ width }} />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Session</p>
          <p className="mt-1 text-sm text-muted">Déconnexion sécurisée.</p>
        </div>
        <button onClick={handleLogout} className="rounded-full border border-accent/30 bg-accent px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-accent/90">
          Déconnexion
        </button>
      </div>
    </div>
  )
}
