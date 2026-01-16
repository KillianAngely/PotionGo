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

    const getRoleBadgeStyle = (role: string) => {
        const baseStyle = { display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }
        if (role === UserAdminRole.ADMIN) return { ...baseStyle, backgroundColor: '#fee2e2', color: '#991b1b' }
        if (role === UserClientRole.DRIVER) return { ...baseStyle, backgroundColor: '#dbeafe', color: '#1e40af' }
        return { ...baseStyle, backgroundColor: '#d1fae5', color: '#065f46' }
    }

    const handleRowClick = (userId: string) => {
        router.push(`/dashboard/users/${userId}`)
    }

    // if (loading) {
    //     return <div style={{ padding: '2rem' }}>Chargement...</div>
    // }

    return (
        <div style={{ padding: '2rem' }}>
            <button
                onClick={() => router.push("/dashboard")}
                style={{ marginBottom: '1rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0.5rem 0' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#3b82f6'}
            >
                ← Retour au dashboard
            </button>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Gestion des Utilisateurs</h1>

            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label htmlFor="roleFilter" style={{ fontWeight: '500' }}>
                    Filtrer par rôle:
                </label>
                <select
                    id="roleFilter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{ border: '1px solid #d1d5db', borderRadius: '0.25rem', padding: '0.5rem 0.75rem', fontSize: '1rem' }}
                >
                    <option value="all">Tous</option>
                    <option value={UserAdminRole.ADMIN}>Admin</option>
                    <option value={UserClientRole.CUSTOMER}>Customer</option>
                    <option value={UserClientRole.DRIVER}>Driver</option>
                </select>
                <span style={{ color: '#6b7280', marginLeft: '1rem' }}>
                    {users.length} utilisateur(s) trouvé(s)
                </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', backgroundColor: 'white', border: '1px solid #d1d5db', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f3f4f6', color: 'black' }}>
                        <tr>
                            <th style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db', textAlign: 'left', fontWeight: '600' }}>Email</th>
                            <th style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db', textAlign: 'left', fontWeight: '600' }}>Prénom</th>
                            <th style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db', textAlign: 'left', fontWeight: '600' }}>Nom</th>
                            <th style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db', textAlign: 'left', fontWeight: '600' }}>Rôle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 1rem' }}>
                                    Aucun utilisateur trouvé
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr
                                    key={user.uid}
                                    onClick={() => handleRowClick(user.uid)}
                                    style={{ cursor: 'pointer', transition: 'background-color 0.2s', color: 'black' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db' }}>{user.email}</td>
                                    <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db' }}>{user.firstName}</td>
                                    <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db' }}>{user.lastName}</td>
                                    <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db' }}>
                                        <span style={getRoleBadgeStyle(user.role)}>
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