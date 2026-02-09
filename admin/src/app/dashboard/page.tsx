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
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-border bg-bg/80 p-6">
        <h2 className="text-lg font-semibold">Accès rapide</h2>
        <p className="mt-1 text-sm text-muted">
          Choisis un module pour gérer les données principales.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => router.push("/dashboard/users")}
            className="group rounded-2xl border border-border bg-card px-5 py-4 text-left shadow-glow transition hover:-translate-y-1 hover:border-accent/60"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Utilisateurs
            </p>
            <h3 className="mt-2 text-lg font-semibold">Gérer les comptes</h3>
            <p className="mt-2 text-sm text-muted">
              Parcourir, filtrer et consulter les profils.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-accent2">
              Ouvrir →
            </span>
          </button>
          <button
            onClick={() => router.push("/dashboard/orders")}
            className="group rounded-2xl border border-border bg-card px-5 py-4 text-left shadow-glow transition hover:-translate-y-1 hover:border-accent/60"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Commandes
            </p>
            <h3 className="mt-2 text-lg font-semibold">Suivre les livraisons</h3>
            <p className="mt-2 text-sm text-muted">
              Statuts, clients et détails de livraison.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-accent2">
              Ouvrir →
            </span>
          </button>
          <button
            onClick={() => router.push("/dashboard/products")}
            className="group rounded-2xl border border-border bg-card px-5 py-4 text-left shadow-glow transition hover:-translate-y-1 hover:border-accent/60"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Produits
            </p>
            <h3 className="mt-2 text-lg font-semibold">Suivre les potions</h3>
            <p className="mt-2 text-sm text-muted">
              Inventaire, mood et détails des offres.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-accent2">
              Ouvrir →
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Session
          </p>
          <p className="mt-1 text-sm text-muted">Déconnexion sécurisée.</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-full border border-accent/30 bg-accent px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-accent/90"
        >
          Déconnexion
        </button>
      </div>
    </div>
  )
}
