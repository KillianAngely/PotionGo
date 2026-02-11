import { firestore } from "../../../../config/firebase"
import admin from "../../../../config/firebase-admin"
import { collection, getDocs } from "firebase/firestore"
import { Product, productSchema } from "./schema"
import { buildAuthErrorResponse, requireAdmin } from "../_utils/auth"

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return buildAuthErrorResponse(auth)
    }

    const productsRef = collection(firestore, "products")
    const snapshot = await getDocs(productsRef)

    const products: Product[] = snapshot.docs
      .map((doc) => {
        const validation = productSchema.safeParse(doc.data())
        if (!validation.success) return null
        return {
          id: doc.id,
          ...validation.data,
        } as Product
      })
      .filter(Boolean) as Product[]

    return new Response(
      JSON.stringify({
        success: true,
        products,
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
