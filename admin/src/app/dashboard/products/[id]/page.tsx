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
        const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
        const normalizedMood = mood.toUpperCase()
        if (normalizedMood === "SAD") return `${base} bg-accent2/15 text-accent2`
        if (normalizedMood === "HAPPY") return `${base} bg-accent/15 text-accent`
        if (normalizedMood === "ANGRY") return `${base} bg-accent/20 text-accent`
        return `${base} bg-accent3/15 text-accent3`
    }

    if (loading) {
        return <div className="text-sm text-muted">Chargement...</div>
    }

    if (!product) {
        return (
            <div className="space-y-4">
                <h1 className="text-xl font-semibold">Produit non trouvé</h1>
                <button
                    onClick={() => router.push("/dashboard/products")}
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
                onClick={() => router.push("/dashboard/products")}
                className="text-sm font-semibold text-accent2 transition hover:text-accent"
            >
                ← Retour à la liste
            </button>

            <div className="max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-glow">
                <div className="flex flex-wrap items-start gap-4">
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-24 w-24 rounded-2xl object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="h-24 w-24 rounded-2xl border border-border bg-bg/60" />
                    )}
                    <div>
                        <h1 className="text-xl font-semibold">Détails du produit</h1>
                        <p className="mt-1 text-sm text-muted">{product.name}</p>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 text-sm text-muted">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                            ID
                        </p>
                        <p className="mt-1 text-sm text-fg">{product.id}</p>
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                            Nom
                        </p>
                        <p className="mt-1 text-sm text-fg">{product.name}</p>
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                            Humeur
                        </p>
                        <span className={getMoodBadgeStyle(product.mood)}>
                            {product.mood}
                        </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                                Prix
                            </p>
                            <p className="mt-1 text-sm text-fg">{product.price.toFixed(2)} €</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                                Description
                            </p>
                            <p className="mt-1 text-sm text-fg">{product.description || "—"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
