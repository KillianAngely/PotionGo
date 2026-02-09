"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { UserRepository } from "../../00_INFRA/Repositories/User/UserRepository"
import { User, UserAdminRole, UserClientRole } from "../../00_INFRA/types/User"

export default function Dashboard() {
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [roleFilter, setRoleFilter] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")

    const userRepository = new UserRepository()

    useEffect(() => {
        loadUsers()
    }, [roleFilter])

    const loadUsers = async () => {
        setLoading(true)
        try {
            let fetchedUsers: User[] | null

            if (roleFilter === "all") {
                fetchedUsers = await userRepository.findAll()
            } else {
                fetchedUsers = await userRepository.findAllByRole(
                    roleFilter as UserAdminRole | UserClientRole
                )
            }

            setUsers(fetchedUsers || [])
        } catch (error) {
            console.error("Erreur lors du chargement des utilisateurs:", error)
        } finally {
            setLoading(false)
        }
    }

    const getRoleBadgeClass = (role: string) => {
        const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
        if (role === UserAdminRole.ADMIN) return `${base} bg-accent/15 text-accent`
        if (role === UserClientRole.DRIVER) return `${base} bg-accent2/15 text-accent2`
        return `${base} bg-accent3/15 text-accent3`
    }

    const handleRowClick = (userId: string) => {
        router.push(`/dashboard/users/${userId}`)
    }

    if (loading) {
        return <div className="text-sm text-muted">Chargement...</div>
    }

    const normalizedSearch = searchTerm.trim().toLowerCase()
    const filteredUsers = normalizedSearch
        ? users.filter((user) => {
              const email = user.email?.toLowerCase() ?? ""
              const first = user.firstName?.toLowerCase() ?? ""
              const last = user.lastName?.toLowerCase() ?? ""
              return (
                  email.includes(normalizedSearch) ||
                  first.includes(normalizedSearch) ||
                  last.includes(normalizedSearch)
              )
          })
        : users

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                        Utilisateurs
                    </p>
                    <h2 className="text-xl font-semibold">Gestion des utilisateurs</h2>
                </div>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="text-sm font-semibold text-accent2 transition hover:text-accent"
                >
                    ← Retour au dashboard
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-bg/80 px-4 py-3">
                <label htmlFor="roleFilter" className="text-sm font-semibold">
                    Filtrer par rôle:
                </label>
                <select
                    id="roleFilter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                >
                    <option value="all">Tous</option>
                    <option value={UserAdminRole.ADMIN}>Admin</option>
                    <option value={UserClientRole.CUSTOMER}>Customer</option>
                    <option value={UserClientRole.DRIVER}>Driver</option>
                </select>
                <div className="flex items-center gap-2">
                    <label htmlFor="userSearch" className="text-sm font-semibold">
                        Recherche:
                    </label>
                    <input
                        id="userSearch"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Email, prénom ou nom"
                        className="w-64 rounded-lg border border-border bg-card px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                    />
                </div>
                <span className="text-sm text-muted">
                    {filteredUsers.length} utilisateur(s) trouvé(s)
                </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border">
                <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-bg/80 text-left text-xs uppercase tracking-[0.2em] text-muted">
                        <tr>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Prénom</th>
                            <th className="px-4 py-3">Nom</th>
                            <th className="px-4 py-3">Rôle</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                                    Aucun utilisateur trouvé
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr
                                    key={user.uid}
                                    onClick={() => handleRowClick(user.uid)}
                                    className="cursor-pointer transition hover:bg-bg/80"
                                >
                                    <td className="px-4 py-3">{user.email}</td>
                                    <td className="px-4 py-3">{user.firstName}</td>
                                    <td className="px-4 py-3">{user.lastName}</td>
                                    <td className="px-4 py-3">
                                        <span className={getRoleBadgeClass(user.role)}>
                                            {user.role}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
