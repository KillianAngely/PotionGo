import { firestore } from "../../../../config/firebase"
import admin from "../../../../config/firebase-admin"
import { collection, getDocs } from "firebase/firestore"
import { Product, productSchema } from "./schema"
import { buildAuthErrorResponse, requireAdmin } from "../_utils/auth"
import { requireCsrf } from "../_utils/csrf"

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const parsePositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

const parseOptionalNumber = (value: string | null) => {
  if (value === null || value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseSorts = (sortRaw: string | null, allowedFields: readonly string[]) => {
  if (!sortRaw) return [] as Array<{ field: string; direction: "asc" | "desc" }>

  return sortRaw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [fieldRaw, directionRaw] = part.split(":")
      const field = (fieldRaw || "").trim()
      const direction = directionRaw === "desc" ? "desc" : "asc"
      if (!allowedFields.includes(field)) return null
      return { field, direction } as const
    })
    .filter(Boolean) as Array<{ field: string; direction: "asc" | "desc" }>
}

const compareValues = (a: unknown, b: unknown) => {
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a ?? "").localeCompare(String(b ?? ""), "fr", { sensitivity: "base" })
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return buildAuthErrorResponse(auth)
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim().toLowerCase() ?? ""
    const mood = searchParams.get("mood")?.trim().toLowerCase() ?? ""
    const minPrice = parseOptionalNumber(searchParams.get("minPrice"))
    const maxPrice = parseOptionalNumber(searchParams.get("maxPrice"))
    const page = parsePositiveInt(searchParams.get("page"), 1)
    const pageSize = clamp(parsePositiveInt(searchParams.get("pageSize"), 10), 1, 100)
    const sorts = parseSorts(searchParams.get("sort"), ["name", "mood", "price"])

    const productsRef = collection(firestore, "products")
    const snapshot = await getDocs(productsRef)

    const products = snapshot.docs
      .map((doc) => {
        const validation = productSchema.safeParse(doc.data())
        if (!validation.success) return null
        return {
          id: doc.id,
          ...validation.data,
        } as Product
      })
      .filter(Boolean) as Product[]

    const filteredProducts = products.filter((product) => {
      if (search) {
        const text = `${product.name} ${product.description ?? ""}`.toLowerCase()
        if (!text.includes(search)) return false
      }
      if (mood && product.mood.toLowerCase() !== mood) return false
      if (typeof minPrice === "number" && product.price < minPrice) return false
      if (typeof maxPrice === "number" && product.price > maxPrice) return false
      return true
    })

    const sortedProducts = [...filteredProducts]
    sortedProducts.sort((a, b) => {
      for (const sort of sorts) {
        const comparison = compareValues(
          a[sort.field as keyof Product],
          b[sort.field as keyof Product]
        )
        if (comparison !== 0) {
          return sort.direction === "asc" ? comparison : -comparison
        }
      }
      return a.id.localeCompare(b.id)
    })

    const total = sortedProducts.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = clamp(page, 1, totalPages)
    const start = (safePage - 1) * pageSize
    const pagedProducts = sortedProducts.slice(start, start + pageSize)

    return new Response(
      JSON.stringify({
        success: true,
        products: pagedProducts,
        pagination: {
          page: safePage,
          pageSize,
          total,
          totalPages,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch {
    return new Response(
      JSON.stringify({
        error: "Impossible d'afficher les produits",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return buildAuthErrorResponse(auth)
    }
    const csrfError = requireCsrf(request)
    if (csrfError) return csrfError

    const body = await request.json()
    const validation = productSchema.safeParse(body)
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Données produit invalides",
          details: validation.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const docRef = await admin.firestore().collection("products").add({
      ...validation.data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    const product: Product = {
      id: docRef.id,
      ...validation.data,
    }

    return new Response(JSON.stringify({ success: true, product }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[POST /api/products] Error:", error)
    return new Response(
      JSON.stringify({ error: "Impossible de créer le produit" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
