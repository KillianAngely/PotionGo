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

    const getMoodBadgeClass = (mood: string) => {
        const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
        const normalizedMood = mood.toUpperCase()
        if (normalizedMood === "SAD") return `${base} bg-accent2/15 text-accent2`
        if (normalizedMood === "HAPPY") return `${base} bg-accent/15 text-accent`
        if (normalizedMood === "ANGRY") return `${base} bg-accent/20 text-accent`
        return `${base} bg-accent3/15 text-accent3`
    }

    const handleRowClick = (productId: string) => {
        router.push(`/dashboard/products/${productId}`)
    }

    if (loading) {
        return <div className="text-sm text-muted">Chargement...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                        Produits
                    </p>
                    <h2 className="text-xl font-semibold">Gestion des produits</h2>
                </div>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="text-sm font-semibold text-accent2 transition hover:text-accent"
                >
                    ← Retour au dashboard
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-bg/80 px-4 py-3">
                <span className="text-sm text-muted">
                    {products.length} produit(s) trouvé(s)
                </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border">
                <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-bg/80 text-left text-xs uppercase tracking-[0.2em] text-muted">
                        <tr>
                            <th className="px-4 py-3">Nom</th>
                            <th className="px-4 py-3">Humeur</th>
                            <th className="px-4 py-3">Prix</th>
                            <th className="px-4 py-3">Description</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                                    Aucun produit trouvé
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr
                                    key={product.id}
                                    onClick={() => handleRowClick(product.id)}
                                    className="cursor-pointer transition hover:bg-bg/80"
                                >
                                    <td className="px-4 py-3">{product.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={getMoodBadgeClass(product.mood)}>
                                            {product.mood}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {product.price.toFixed(2)} €
                                    </td>
                                    <td className="px-4 py-3 text-muted">
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
