import { firestore } from "../../../../../config/firebase"
import admin from "../../../../../config/firebase-admin"
import { doc, getDoc } from "firebase/firestore"
import { Product, productSchema } from "../schema"
import { requireAdmin } from "../../_utils/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { id } = await params

    const productDocRef = doc(firestore, "products", id)
    const productDoc = await getDoc(productDocRef)

    if (!productDoc.exists()) {
      return new Response(
        JSON.stringify({
          error: "Produit non trouvé",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    const validation = productSchema.safeParse(productDoc.data())
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Données produit invalides",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const product: Product = {
      id: productDoc.id,
      ...validation.data,
    } as Product

    return new Response(
      JSON.stringify({
        success: true,
        product,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Impossible de récupérer le produit",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { id } = await params

    if (!id) {
      return new Response(JSON.stringify({ error: "ID produit requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    await admin.firestore().collection("products").doc(id).delete()

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[DELETE /api/products/[id]] Error:", error)
    return new Response(
      JSON.stringify({ error: "Impossible de supprimer le produit" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
