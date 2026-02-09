import { firestore } from "../../../../config/firebase"
import { collection, getDocs } from "firebase/firestore"
import { Product, productSchema } from "./schema"
import { requireAdmin } from "../_utils/auth"

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { "Content-Type": "application/json" },
      })
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
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Impossible d'afficher les produits",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
