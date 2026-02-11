import admin from "../../../../../config/firebase-admin"
import { buildAuthErrorResponse, requireAdmin } from "../../_utils/auth"
import { requireCsrf } from "../../_utils/csrf"

// GET /api/ratings/[id] - Détail d'un rating
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return buildAuthErrorResponse(auth)

    const { id } = await params
    const ratingDoc = await admin.firestore().collection("ratings").doc(id).get()

    if (!ratingDoc.exists) {
      return new Response(
        JSON.stringify({ error: "Rating introuvable" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    const data = ratingDoc.data()!
    const rating = {
      id: ratingDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    }

    return new Response(
      JSON.stringify({ success: true, rating }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("[GET /api/ratings/[id]] Error:", error)
    return new Response(
      JSON.stringify({ error: "Erreur lors de la récupération du rating" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

// DELETE /api/ratings/[id] - Supprimer un rating
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return buildAuthErrorResponse(auth)

    const csrfError = requireCsrf(request)
    if (csrfError) return csrfError

    const { id } = await params
    const ratingDoc = await admin.firestore().collection("ratings").doc(id).get()

    if (!ratingDoc.exists) {
      return new Response(
        JSON.stringify({ error: "Rating introuvable" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    await admin.firestore().collection("ratings").doc(id).delete()

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("[DELETE /api/ratings/[id]] Error:", error)
    return new Response(
      JSON.stringify({ error: "Erreur lors de la suppression du rating" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
