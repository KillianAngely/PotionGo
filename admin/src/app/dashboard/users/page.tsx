"use client"
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { UserRepository } from "../../00_INFRA/Repositories/User/UserRepository"
import { User, UserAdminRole, UserClientRole } from "../../00_INFRA/types/User"

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

type SortField = "email" | "firstName" | "lastName" | "role"
type SortDir = "asc" | "desc"

export default function DashboardUsersPage() {
  const router = useRouter()
  const userRepository = useMemo(() => new UserRepository(), [])

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [primaryField, setPrimaryField] = useState<SortField>("lastName")
  const [primaryDir, setPrimaryDir] = useState<SortDir>("asc")
  const [secondaryField, setSecondaryField] = useState<SortField | "none">("email")
  const [secondaryDir, setSecondaryDir] = useState<SortDir>("asc")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: UserClientRole.DRIVER,
  })

  const sortValue = useMemo(() => {
    const sorts = [`${primaryField}:${primaryDir}`]
    if (secondaryField !== "none" && secondaryField !== primaryField) {
      sorts.push(`${secondaryField}:${secondaryDir}`)
    }
    return sorts
  }, [primaryField, primaryDir, secondaryField, secondaryDir])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await userRepository.list({
        page,
        pageSize,
        role: roleFilter as UserAdminRole | UserClientRole | "all",
        search: searchTerm.trim() || undefined,
        sort: sortValue,
      })
      setUsers(result.users)
      setTotal(result.pagination.total)
      setTotalPages(result.pagination.totalPages)
      if (result.pagination.page !== page) {
        setPage(result.pagination.page)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error)
      setUsers([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, roleFilter, searchTerm, userRepository, sortValue])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

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
    if (!deleteTarget || isDeleting) return
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await userRepository.removeById(deleteTarget.uid)
      await loadUsers()
      setDeleteTarget(null)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Erreur lors de la suppression")
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
        email: createForm.email.trim(),
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
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
      setCreateError(error instanceof Error ? error.message : "Erreur lors de la création")
    } finally {
      setIsCreating(false)
    }
  }

  const handleExportUsers = async () => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/users/export", { credentials: "include" })
      if (!response.ok) {
        throw new Error("Impossible d'exporter les utilisateurs")
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export users failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Utilisateurs</p>
          <h2 className="text-xl font-semibold">Gestion des utilisateurs</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportUsers}
            disabled={isExporting}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg disabled:opacity-60"
          >
            {isExporting ? "Export..." : "Exporter CSV"}
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90"
          >
            + Ajouter un utilisateur
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-bg/80 px-4 py-3">
        <label htmlFor="roleFilter" className="text-sm font-semibold">Rôle</label>
        <select
          id="roleFilter"
          value={roleFilter}
          onChange={(e) => {
            setPage(1)
            setRoleFilter(e.target.value)
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">Tous</option>
          <option value={UserAdminRole.ADMIN}>Admin</option>
          <option value={UserClientRole.CUSTOMER}>Customer</option>
          <option value={UserClientRole.DRIVER}>Driver</option>
        </select>

        <label htmlFor="userSearch" className="text-sm font-semibold">Recherche</label>
        <input
          id="userSearch"
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setPage(1)
            setSearchTerm(e.target.value)
          }}
          placeholder="Email, prénom, nom"
          className="w-64 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />

        <label htmlFor="primarySort" className="text-sm font-semibold">Tri 1</label>
        <select
          id="primarySort"
          value={primaryField}
          onChange={(e) => {
            setPage(1)
            setPrimaryField(e.target.value as SortField)
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="lastName">Nom</option>
          <option value="firstName">Prénom</option>
          <option value="email">Email</option>
          <option value="role">Rôle</option>
        </select>
        <select
          value={primaryDir}
          onChange={(e) => {
            setPage(1)
            setPrimaryDir(e.target.value as SortDir)
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>

        <label htmlFor="secondarySort" className="text-sm font-semibold">Tri 2</label>
        <select
          id="secondarySort"
          value={secondaryField}
          onChange={(e) => {
            setPage(1)
            setSecondaryField(e.target.value as SortField | "none")
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="none">Aucun</option>
          <option value="lastName">Nom</option>
          <option value="firstName">Prénom</option>
          <option value="email">Email</option>
          <option value="role">Rôle</option>
        </select>
        <select
          value={secondaryDir}
          onChange={(e) => {
            setPage(1)
            setSecondaryDir(e.target.value as SortDir)
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          disabled={secondaryField === "none"}
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>

        <label htmlFor="pageSize" className="text-sm font-semibold">Par page</label>
        <select
          id="pageSize"
          value={pageSize}
          onChange={(e) => {
            setPage(1)
            setPageSize(Number(e.target.value))
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <span className="text-sm text-muted ml-auto">{total} utilisateur(s)</span>
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
            {!loading && users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">Aucun utilisateur trouvé</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.uid}
                  onClick={() => handleRowClick(user.uid)}
                  className="cursor-pointer transition hover:bg-bg/80"
                >
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.firstName}</td>
                  <td className="px-4 py-3">{user.lastName}</td>
                  <td className="px-4 py-3"><span className={getRoleBadgeClass(user.role)}>{user.role}</span></td>
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

      <div className="flex items-center justify-between rounded-2xl border border-border bg-bg/70 px-4 py-3">
        <p className="text-sm text-muted">Page {page} / {totalPages}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Précédent
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} aria-label="Fermer" />
          <div className="relative w-[min(92vw,460px)] rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Supprimer ce compte ?</h3>
            <p className="mt-3 text-sm text-muted">{deleteTarget.firstName} {deleteTarget.lastName} — {deleteTarget.email}</p>
            {deleteError && <p className="mt-3 text-sm text-red-600">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Annuler</button>
              <button type="button" onClick={handleDeleteConfirm} disabled={isDeleting} className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setIsCreateOpen(false)} aria-label="Fermer" />
          <div className="relative w-[min(92vw,520px)] rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Ajouter un utilisateur</h3>
            <form className="mt-6 space-y-4" onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="text" value={createForm.firstName} onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))} placeholder="Prénom" className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm" required />
                <input type="text" value={createForm.lastName} onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))} placeholder="Nom" className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm" required />
              </div>
              <input type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm" required />
              <input type="password" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} placeholder="Mot de passe" className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm" required />
              <select value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value as UserClientRole }))} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm">
                <option value={UserClientRole.CUSTOMER}>Customer</option>
                <option value={UserClientRole.DRIVER}>Driver</option>
              </select>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Annuler</button>
                <button type="submit" disabled={isCreating} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-60">
                  {isCreating ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
