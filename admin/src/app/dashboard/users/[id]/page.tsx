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
        const baseStyle = { display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }
        if (role === UserAdminRole.ADMIN) return { ...baseStyle, backgroundColor: '#fee2e2', color: '#991b1b' }
        if (role === UserClientRole.DRIVER) return { ...baseStyle, backgroundColor: '#dbeafe', color: '#1e40af' }
        return { ...baseStyle, backgroundColor: '#d1fae5', color: '#065f46' }
    }

    if (loading) {
        return <div style={{ padding: '2rem' }}>Chargement...</div>
    }

    if (!user) {
        return (
            <div style={{ padding: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Utilisateur non trouvé</h1>
                <button
                    onClick={() => router.push("/dashboard/users")}
                    style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0.5rem 0' }}
                >
                    Retour à la liste
                </button>
            </div>
        )
    }

    return (
        <div style={{ padding: '2rem' }}>
            <button
                onClick={() => router.push("/dashboard/users")}
                style={{ marginBottom: '1rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0.5rem 0' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#3b82f6'}
            >
                ← Retour à la liste
            </button>

            <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '1.5rem', maxWidth: '48rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'black' }}>Détails de l'utilisateur</h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem', color: 'black' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: '500', color: '#374151' }}>ID:</label>
                        <p style={{ color: '#111827', margin: '0' }}>{user.uid}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: '500', color: '#374151' }}>Email:</label>
                        <p style={{ color: '#111827', margin: '0' }}>{user.email}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: '500', color: '#374151' }}>Prénom:</label>
                        <p style={{ color: '#111827', margin: '0' }}>{user.firstName}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: '500', color: '#374151' }}>Nom:</label>
                        <p style={{ color: '#111827', margin: '0' }}>{user.lastName}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: '500', color: '#374151' }}>Rôle:</label>
                        <span style={getRoleBadgeStyle(user.role)}>
                            {user.role}
                        </span>
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleDelete}
                        style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                    >
                        Supprimer l'utilisateur
                    </button>
                </div>
            </div>
        </div>
    )
}