import admin from "../../../../../../config/firebase-admin"
import { buildAuthErrorResponse, requireAdmin } from "../../../_utils/auth"
import { Rating } from "../../../../00_INFRA/types/Rating"

// GET /api/users/[id]/ratings - Tous les ratings d'un user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return buildAuthErrorResponse(auth)

    const { id: userId } = await params

    const ratingsSnapshot = await admin
      .firestore()
      .collection("ratings")
      .where("revieweeId", "==", userId)
      .get()

    const ratings: Rating[] = ratingsSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        orderId: doc.data().orderId,
        reviewerId: doc.data().reviewerId,
        reviewerRole: doc.data().reviewerRole,
        revieweeId: doc.data().revieweeId,
        revieweeRole: doc.data().revieweeRole,
        rating: doc.data().rating,
        comment: doc.data().comment,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }))
      .sort((a, b) => {
        // Tri par date décroissante (plus récent d'abord)
        if (!a.createdAt) return 1
        if (!b.createdAt) return -1
        return b.createdAt.getTime() - a.createdAt.getTime()
      })

    // Calculer les stats
    const totalRatings = ratings.length
    const averageRating = totalRatings
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    ratings.forEach((r) => {
      distribution[r.rating as 1 | 2 | 3 | 4 | 5]++
    })

    return new Response(
      JSON.stringify({
        success: true,
        ratings,
        stats: {
          averageRating: Math.round(averageRating * 100) / 100,
          totalRatings,
          ratingDistribution: distribution,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("[GET /api/users/[id]/ratings] Error:", error)
    return new Response(
      JSON.stringify({ error: "Erreur lors de la récupération des ratings" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
