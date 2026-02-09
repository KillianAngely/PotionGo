"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { UserRepository } from "../../../00_INFRA/Repositories/User/UserRepository"
import { User, UserAdminRole, UserClientRole } from "../../../00_INFRA/types/User"

export default function UserDetailPage() {
    const router = useRouter()
    const params = useParams()
    const userId = params.id as string

    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const userRepository = new UserRepository()

    useEffect(() => {
        loadUser()
    }, [userId])

    const loadUser = async () => {
        setLoading(true)
        try {
            const fetchedUser = await userRepository.findById(userId)
            setUser(fetchedUser)
        } catch (error) {
            console.error("Erreur lors du chargement de l'utilisateur:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
            return
        }

        try {
            await userRepository.removeById(userId)
            router.push("/dashboard/users")
        } catch (error) {
            console.error("Erreur lors de la suppression:", error)
            alert("Erreur lors de la suppression de l'utilisateur")
        }
    }

    const getRoleBadgeStyle = (role: string) => {
        const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
        if (role === UserAdminRole.ADMIN) return `${base} bg-accent/15 text-accent`
        if (role === UserClientRole.DRIVER) return `${base} bg-accent2/15 text-accent2`
        return `${base} bg-accent3/15 text-accent3`
    }

    if (loading) {
        return <div className="text-sm text-muted">Chargement...</div>
    }

    if (!user) {
        return (
            <div className="space-y-4">
                <h1 className="text-xl font-semibold">Utilisateur non trouvé</h1>
                <button
                    onClick={() => router.push("/dashboard/users")}
                    className="text-sm font-semibold text-accent2 transition hover:text-accent"
                >
                    Retour à la liste
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <button
                onClick={() => router.push("/dashboard/users")}
                className="text-sm font-semibold text-accent2 transition hover:text-accent"
            >
                ← Retour à la liste
            </button>

            <div className="max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-glow">
                <h1 className="text-xl font-semibold">Détails de l'utilisateur</h1>

                <div className="mt-6 grid gap-4 text-sm text-muted">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                            ID
                        </p>
                        <p className="mt-1 text-sm text-fg">{user.uid}</p>
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                            Email
                        </p>
                        <p className="mt-1 text-sm text-fg">{user.email}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                                Prénom
                            </p>
                            <p className="mt-1 text-sm text-fg">{user.firstName}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                                Nom
                            </p>
                            <p className="mt-1 text-sm text-fg">{user.lastName}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                            Rôle
                        </p>
                        <span className={getRoleBadgeStyle(user.role)}>
                            {user.role}
                        </span>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={handleDelete}
                        className="rounded-full border border-accent/30 bg-accent px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-accent/90"
                    >
                        Supprimer l'utilisateur
                    </button>
                </div>
            </div>
        </div>
    )
}
