"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ProductRepository } from "../../../00_INFRA/Repositories/Product/ProductRepository"
import { Product } from "../../../00_INFRA/types/Product"

export default function ProductDetailPage() {
    const router = useRouter()
    const params = useParams()
    const productId = params.id as string

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)

    const productRepository = new ProductRepository()

    useEffect(() => {
        loadProduct()
    }, [productId])

    const loadProduct = async () => {
        setLoading(true)
        try {
            const fetchedProduct = await productRepository.findById(productId)
            setProduct(fetchedProduct)
        } catch (error) {
            console.error("Erreur lors du chargement du produit:", error)
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

    if (loading) {
        return <div style={{ padding: '2rem' }}>Chargement...</div>
    }

    if (!product) {
        return (
            <div style={{ padding: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Produit non trouvé</h1>
                <button
                    onClick={() => router.push("/dashboard/products")}
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
                onClick={() => router.push("/dashboard/products")}
                style={{ marginBottom: '1rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0.5rem 0' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#3b82f6'}
            >
                ← Retour à la liste
            </button>

            <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '1.5rem', maxWidth: '48rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'black' }}>Détails du produit</h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem', color: 'black' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: '500', color: '#374151' }}>ID:</label>
                        <p style={{ color: '#111827', margin: '0' }}>{product.id}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: '500', color: '#374151' }}>Nom:</label>
                        <p style={{ color: '#111827', margin: '0' }}>{product.name}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: '500', color: '#374151' }}>Humeur:</label>
                        <span style={getMoodBadgeStyle(product.mood)}>
                            {product.mood}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: '500', color: '#374151' }}>Prix:</label>
                        <p style={{ color: '#111827', margin: '0' }}>{product.price.toFixed(2)} €</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: '500', color: '#374151' }}>Description:</label>
                        <p style={{ color: '#111827', margin: '0' }}>{product.description || "—"}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
