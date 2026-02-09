"use client"
import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ProductRepository } from "../../00_INFRA/Repositories/Product/ProductRepository"
import { Product } from "../../00_INFRA/types/Product"

export default function Dashboard() {
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [createForm, setCreateForm] = useState({
        name: "",
        mood: "",
        price: "",
        description: "",
    })

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

    const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setCreateError(null)
        if (isCreating) return
        const priceValue = Number(createForm.price)
        if (Number.isNaN(priceValue)) {
            setCreateError("Le prix doit être un nombre valide")
            return
        }
        setIsCreating(true)
        try {
            await productRepository.create({
                name: createForm.name.trim(),
                mood: createForm.mood.trim(),
                price: priceValue,
                description: createForm.description.trim() || undefined,
            })
            await loadProducts()
            setIsCreateOpen(false)
            setCreateForm({
                name: "",
                mood: "",
                price: "",
                description: "",
            })
        } catch (error) {
            setCreateError(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la création du produit"
            )
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget || isDeleting) return
        setDeleteError(null)
        setIsDeleting(true)
        try {
            await productRepository.removeById(deleteTarget.id)
            await loadProducts()
            setDeleteTarget(null)
        } catch (error) {
            setDeleteError(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la suppression du produit"
            )
        } finally {
            setIsDeleting(false)
        }
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
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90"
                >
                    + Ajouter un produit
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
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted">
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
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                setDeleteTarget(product)
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
                                    Produits
                                </p>
                                <h3 className="text-lg font-semibold">Supprimer ce produit ?</h3>
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
                            <p>Cette action est définitive.</p>
                            <p className="text-fg">
                                {deleteTarget.name} — {deleteTarget.price.toFixed(2)} €
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
                                    Produits
                                </p>
                                <h3 className="text-lg font-semibold">Ajouter un produit</h3>
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
                            <div className="space-y-1">
                                <label htmlFor="createName" className="text-sm font-semibold">
                                    Nom
                                </label>
                                <input
                                    id="createName"
                                    type="text"
                                    value={createForm.name}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="createMood" className="text-sm font-semibold">
                                    Humeur
                                </label>
                                <input
                                    id="createMood"
                                    type="text"
                                    value={createForm.mood}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            mood: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                                    required
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label htmlFor="createPrice" className="text-sm font-semibold">
                                        Prix
                                    </label>
                                    <input
                                        id="createPrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={createForm.price}
                                        onChange={(e) =>
                                            setCreateForm((prev) => ({
                                                ...prev,
                                                price: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label
                                        htmlFor="createDescription"
                                        className="text-sm font-semibold"
                                    >
                                        Description
                                    </label>
                                    <input
                                        id="createDescription"
                                        type="text"
                                        value={createForm.description}
                                        onChange={(e) =>
                                            setCreateForm((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                                    />
                                </div>
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
                                    {isCreating ? "Création..." : "Créer le produit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
