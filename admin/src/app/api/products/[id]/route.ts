import { firestore } from "../../../../../config/firebase"
import { doc, getDoc } from "firebase/firestore"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

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

    return new Response(
      JSON.stringify({
        success: true,
        product: {
          id: productDoc.id,
          ...productDoc.data(),
        },
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