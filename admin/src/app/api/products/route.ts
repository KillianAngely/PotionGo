import { firestore } from "../../../../config/firebase"
import { collection, getDocs } from "firebase/firestore"
import { Product } from "./schema"

export async function GET() {
  try {
    const productsRef = collection(firestore, "products")
    const snapshot = await getDocs(productsRef)

    const products: Product[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Product))

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