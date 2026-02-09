"use client"
import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { UserRepository } from "../../00_INFRA/Repositories/User/UserRepository"
import { User, UserAdminRole, UserClientRole } from "../../00_INFRA/types/User"

export default function Dashboard() {
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [roleFilter, setRoleFilter] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [createForm, setCreateForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: UserClientRole.DRIVER,
    })

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

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return
        setDeleteError(null)
        setIsDeleting(true)
        try {
            await userRepository.removeById(deleteTarget.uid)
            await loadUsers()
            setDeleteTarget(null)
        } catch (error) {
            setDeleteError(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la suppression de l'utilisateur"
            )
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setCreateError(null)
        setIsCreating(true)
        try {
            await userRepository.create({
                email: createForm.email,
                firstName: createForm.firstName,
                lastName: createForm.lastName,
                password: createForm.password,
                role: createForm.role,
            })
            await loadUsers()
            setIsCreateOpen(false)
            setCreateForm({
                firstName: "",
                lastName: "",
                email: "",
                password: "",
                role: UserClientRole.DRIVER,
            })
        } catch (error) {
            setCreateError(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la création de l'utilisateur"
            )
        } finally {
            setIsCreating(false)
        }
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
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90"
                >
                    + Ajouter un utilisateur
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
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted">
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
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                setDeleteTarget(user)
                                            }}
                                            className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-500/10"
                                        >
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setDeleteTarget(null)}
                        aria-label="Fermer la fenêtre"
                    />
                    <div className="relative w-[min(92vw,460px)] rounded-2xl border border-border bg-card p-6 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                                    Utilisateurs
                                </p>
                                <h3 className="text-lg font-semibold">Supprimer ce compte ?</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-full px-3 py-1 text-sm text-muted transition hover:text-fg"
                            >
                                Fermer
                            </button>
                        </div>

                        <div className="mt-4 space-y-3 text-sm text-muted">
                            <p>
                                Cette action est définitive et supprimera l'utilisateur dans
                                l'authentification et la base.
                            </p>
                            <p className="text-fg">
                                {deleteTarget.firstName} {deleteTarget.lastName} —{" "}
                                {deleteTarget.email}
                            </p>
                        </div>

                        {deleteError && (
                            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                                {deleteError}
                            </p>
                        )}

                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg"
                                disabled={isDeleting}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Suppression..." : "Oui, supprimer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setIsCreateOpen(false)}
                        aria-label="Fermer la fenêtre"
                    />
                    <div className="relative w-[min(92vw,520px)] rounded-2xl border border-border bg-card p-6 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                                    Utilisateurs
                                </p>
                                <h3 className="text-lg font-semibold">
                                    Ajouter un utilisateur
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="rounded-full px-3 py-1 text-sm text-muted transition hover:text-fg"
                            >
                                Fermer
                            </button>
                        </div>

                        <form className="mt-6 space-y-4" onSubmit={handleCreateSubmit}>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label
                                        htmlFor="createFirstName"
                                        className="text-sm font-semibold"
                                    >
                                        Prénom
                                    </label>
                                    <input
                                        id="createFirstName"
                                        type="text"
                                        value={createForm.firstName}
                                        onChange={(e) =>
                                            setCreateForm((prev) => ({
                                                ...prev,
                                                firstName: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label
                                        htmlFor="createLastName"
                                        className="text-sm font-semibold"
                                    >
                                        Nom
                                    </label>
                                    <input
                                        id="createLastName"
                                        type="text"
                                        value={createForm.lastName}
                                        onChange={(e) =>
                                            setCreateForm((prev) => ({
                                                ...prev,
                                                lastName: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="createEmail" className="text-sm font-semibold">
                                    Email
                                </label>
                                <input
                                    id="createEmail"
                                    type="email"
                                    value={createForm.email}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label
                                    htmlFor="createPassword"
                                    className="text-sm font-semibold"
                                >
                                    Mot de passe
                                </label>
                                <input
                                    id="createPassword"
                                    type="password"
                                    value={createForm.password}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            password: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="createRole" className="text-sm font-semibold">
                                    Rôle
                                </label>
                                <select
                                    id="createRole"
                                    value={createForm.role}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            role: e.target.value as UserClientRole,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                                >
                                    <option value={UserClientRole.DRIVER}>DRIVER</option>
                                    <option value={UserClientRole.CUSTOMER}>CUSTOMER</option>
                                </select>
                            </div>

                            {createError && (
                                <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                                    {createError}
                                </p>
                            )}

                            <div className="flex flex-wrap justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg"
                                    disabled={isCreating}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-60"
                                    disabled={isCreating}
                                >
                                    {isCreating ? "Création..." : "Créer l'utilisateur"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
