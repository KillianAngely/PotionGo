"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProductRepository } from "../../00_INFRA/Repositories/Product/ProductRepository"
import { Product } from "../../00_INFRA/types/Product"

export default function Dashboard() {
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    const productRepository = new ProductRepository()

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const fetchedProducts = await productRepository.findAll()
            setProducts(fetchedProducts || [])
        } catch (error) {
            console.error("Erreur lors du chargement des produits:", error)
        } finally {
            setLoading(false)
        }
    }

    const getMoodBadgeStyle = (mood: string) => {
        const baseStyle = { display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }
        const normalizedMood = mood.toUpperCase()
        if (normalizedMood === "SAD") return { ...baseStyle, backgroundColor: '#e0e7ff', color: '#3730a3' }
        if (normalizedMood === "HAPPY") return { ...baseStyle, backgroundColor: '#fef3c7', color: '#92400e' }
        if (normalizedMood === "ANGRY") return { ...baseStyle, backgroundColor: '#fee2e2', color: '#991b1b' }
        return { ...baseStyle, backgroundColor: '#d1fae5', color: '#065f46' }
    }

    const handleRowClick = (productId: string) => {
        router.push(`/dashboard/products/${productId}`)
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

            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Gestion des Produits</h1>

            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#6b7280' }}>
                    {products.length} produit(s) trouvé(s)
                </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', backgroundColor: 'white', border: '1px solid #d1d5db', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f3f4f6', color: 'black' }}>
                        <tr>
                            <th style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db', textAlign: 'left', fontWeight: '600' }}>Nom</th>
                            <th style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db', textAlign: 'left', fontWeight: '600' }}>Humeur</th>
                            <th style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db', textAlign: 'left', fontWeight: '600' }}>Prix</th>
                            <th style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db', textAlign: 'left', fontWeight: '600' }}>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 1rem' }}>
                                    Aucun produit trouvé
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr
                                    key={product.id}
                                    onClick={() => handleRowClick(product.id)}
                                    style={{ cursor: 'pointer', transition: 'background-color 0.2s', color: 'black' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db' }}>{product.name}</td>
                                    <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db' }}>
                                        <span style={getMoodBadgeStyle(product.mood)}>
                                            {product.mood}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db' }}>
                                        {product.price.toFixed(2)} €
                                    </td>
                                    <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #d1d5db', color: '#4b5563' }}>
                                        {product.description || "—"}
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
