"use client"
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ProductRepository } from "../../00_INFRA/Repositories/Product/ProductRepository"
import { Product } from "../../00_INFRA/types/Product"
import { storage } from "../../../../config/firebase"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]
type SortField = "name" | "mood" | "price"
type SortDir = "asc" | "desc"

export default function DashboardProductsPage() {
  const router = useRouter()
  const productRepository = useMemo(() => new ProductRepository(), [])

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [moodFilter, setMoodFilter] = useState("all")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [primaryField, setPrimaryField] = useState<SortField>("name")
  const [primaryDir, setPrimaryDir] = useState<SortDir>("asc")
  const [secondaryField, setSecondaryField] = useState<SortField | "none">("price")
  const [secondaryDir, setSecondaryDir] = useState<SortDir>("desc")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({
    name: "",
    mood: "",
    price: "",
    description: "",
  })

  const sortValue = useMemo(() => {
    const sorts = [`${primaryField}:${primaryDir}`]
    if (secondaryField !== "none" && secondaryField !== primaryField) {
      sorts.push(`${secondaryField}:${secondaryDir}`)
    }
    return sorts
  }, [primaryField, primaryDir, secondaryField, secondaryDir])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const result = await productRepository.list({
        page,
        pageSize,
        search: searchTerm.trim() || undefined,
        mood: moodFilter,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort: sortValue,
      })
      setProducts(result.products)
      setTotal(result.pagination.total)
      setTotalPages(result.pagination.totalPages)
      if (result.pagination.page !== page) setPage(result.pagination.page)
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error)
      setProducts([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchTerm, moodFilter, minPrice, maxPrice, productRepository, sortValue])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const getMoodBadgeClass = (mood: string) => {
    const base =
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
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
      let imageUrl: string | undefined
      if (imageFile) {
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")
        const storageRef = ref(storage, `public/asset/${Date.now()}-${safeName}`)
        await uploadBytes(storageRef, imageFile)
        imageUrl = await getDownloadURL(storageRef)
      }

      await productRepository.create({
        name: createForm.name.trim(),
        mood: createForm.mood.trim(),
        price: priceValue,
        description: createForm.description.trim() || undefined,
        imageUrl,
      })
      await loadProducts()
      setIsCreateOpen(false)
      setCreateForm({ name: "", mood: "", price: "", description: "" })
      setImageFile(null)
      setImagePreview(null)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Erreur lors de la création")
    } finally {
      setIsCreating(false)
    }
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
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
      setDeleteError(error instanceof Error ? error.message : "Erreur lors de la suppression")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Produits</p>
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

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-bg/80 px-4 py-3">
        <label className="text-sm font-semibold">Recherche</label>
        <input
          value={searchTerm}
          onChange={(e) => {
            setPage(1)
            setSearchTerm(e.target.value)
          }}
          placeholder="Nom, description"
          className="w-60 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />

        <label className="text-sm font-semibold">Mood</label>
        <input
          value={moodFilter === "all" ? "" : moodFilter}
          onChange={(e) => {
            setPage(1)
            setMoodFilter(e.target.value.trim() ? e.target.value : "all")
          }}
          placeholder="HAPPY, SAD..."
          className="w-40 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />

        <label className="text-sm font-semibold">Prix min</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={minPrice}
          onChange={(e) => {
            setPage(1)
            setMinPrice(e.target.value)
          }}
          className="w-28 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />
        <label className="text-sm font-semibold">Prix max</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={maxPrice}
          onChange={(e) => {
            setPage(1)
            setMaxPrice(e.target.value)
          }}
          className="w-28 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />

        <label className="text-sm font-semibold">Tri 1</label>
        <select
          value={primaryField}
          onChange={(e) => {
            setPage(1)
            setPrimaryField(e.target.value as SortField)
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="name">Nom</option>
          <option value="mood">Mood</option>
          <option value="price">Prix</option>
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

        <label className="text-sm font-semibold">Tri 2</label>
        <select
          value={secondaryField}
          onChange={(e) => {
            setPage(1)
            setSecondaryField(e.target.value as SortField | "none")
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="none">Aucun</option>
          <option value="name">Nom</option>
          <option value="mood">Mood</option>
          <option value="price">Prix</option>
        </select>
        <select
          value={secondaryDir}
          onChange={(e) => {
            setPage(1)
            setSecondaryDir(e.target.value as SortDir)
          }}
          disabled={secondaryField === "none"}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>

        <label className="text-sm font-semibold">Par page</label>
        <select
          value={pageSize}
          onChange={(e) => {
            setPage(1)
            setPageSize(Number(e.target.value))
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <span className="ml-auto text-sm text-muted">{total} produit(s)</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-bg/80 text-left text-xs uppercase tracking-[0.2em] text-muted">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Humeur</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {!loading && products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
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
                  <td className="px-4 py-3">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-10 w-10 rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg border border-border bg-bg/60" />
                    )}
                  </td>
                  <td className="px-4 py-3">{product.name}</td>
                  <td className="px-4 py-3">
                    <span className={getMoodBadgeClass(product.mood)}>{product.mood}</span>
                  </td>
                  <td className="px-4 py-3">{product.price.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-muted">{product.description || "—"}</td>
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

      <div className="flex items-center justify-between rounded-2xl border border-border bg-bg/70 px-4 py-3">
        <p className="text-sm text-muted">
          Page {page} / {totalPages}
        </p>
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
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDeleteTarget(null)}
            aria-label="Fermer"
          />
          <div className="relative w-[min(92vw,460px)] rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Supprimer ce produit ?</h3>
            <p className="mt-3 text-sm text-muted">
              {deleteTarget.name} — {deleteTarget.price.toFixed(2)} €
            </p>
            {deleteError && <p className="mt-3 text-sm text-red-600">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
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
            aria-label="Fermer"
          />
          <div className="relative w-[min(92vw,520px)] rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Ajouter un produit</h3>
            <form className="mt-6 space-y-4" onSubmit={handleCreateSubmit}>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nom"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                required
              />
              <input
                type="text"
                value={createForm.mood}
                onChange={(e) => setCreateForm((p) => ({ ...p, mood: e.target.value }))}
                placeholder="Mood"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={createForm.price}
                onChange={(e) => setCreateForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="Prix"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                required
              />
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                rows={4}
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="h-24 w-24 rounded-lg object-cover"
                />
              )}
              {createError && <p className="text-sm text-red-600">{createError}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-60"
                >
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
