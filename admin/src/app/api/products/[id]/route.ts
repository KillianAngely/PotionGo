import { firestore } from "../../../../../config/firebase"
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
