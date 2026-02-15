import admin from "../../../../config/firebase-admin"
import { buildAuthErrorResponse, requireAdmin } from "../_utils/auth"
import { requireCsrf } from "../_utils/csrf"
import { ratingCreateSchema } from "./schema"
import { Rating } from "../../00_INFRA/types/Rating"

type RatingDocument = Omit<Rating, "id" | "createdAt" | "updatedAt"> & {
  comment?: string | null
  createdAt?: FirebaseFirestore.Timestamp
  updatedAt?: FirebaseFirestore.Timestamp
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const parsePositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

// GET /api/ratings - Liste des ratings avec filtres
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return buildAuthErrorResponse(auth)

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId") ?? null
    const revieweeId = searchParams.get("revieweeId") ?? null
    const minRating = parsePositiveInt(searchParams.get("minRating"), 1)
    const maxRating = clamp(parsePositiveInt(searchParams.get("maxRating"), 5), 1, 5)
    const page = parsePositiveInt(searchParams.get("page"), 1)
    const pageSize = clamp(parsePositiveInt(searchParams.get("pageSize"), 10), 1, 100)

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = admin
      .firestore()
      .collection("ratings")

    if (orderId) {
      query = query.where("orderId", "==", orderId)
    }
    if (revieweeId) {
      query = query.where("revieweeId", "==", revieweeId)
    }

    const snapshot = await query.get()

    const ratings: Rating[] = snapshot.docs
      .map((doc) => {
        const data = doc.data() as RatingDocument
        return {
          id: doc.id,
          orderId: data.orderId,
          reviewerId: data.reviewerId,
          reviewerRole: data.reviewerRole,
          revieweeId: data.revieweeId,
          revieweeRole: data.revieweeRole,
          rating: data.rating,
          comment: data.comment ?? undefined,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        }
      })
      .filter((r: Rating) => r.rating >= minRating && r.rating <= maxRating)
      .sort((a, b) => {
        // Tri par date décroissante (plus récent d'abord)
        if (!a.createdAt) return 1
        if (!b.createdAt) return -1
        return b.createdAt.getTime() - a.createdAt.getTime()
      })

    const total = ratings.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = clamp(page, 1, totalPages)
    const start = (safePage - 1) * pageSize
    const pagedRatings = ratings.slice(start, start + pageSize)

    return new Response(
      JSON.stringify({
        success: true,
        ratings: pagedRatings,
        pagination: { page: safePage, pageSize, total, totalPages },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("[GET /api/ratings] Error:", error)
    return new Response(JSON.stringify({ error: "Erreur lors de la récupération des ratings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// POST /api/ratings - Créer un rating
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return buildAuthErrorResponse(auth)

    const csrfError = requireCsrf(request)
    if (csrfError) return csrfError

    const body = await request.json()
    const validation = ratingCreateSchema.safeParse(body)

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Données de rating invalides",
          details: validation.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const { orderId, reviewerId, reviewerRole, revieweeId, revieweeRole, rating, comment } =
      validation.data

    // Vérifier que l'order existe
    const orderDoc = await admin.firestore().collection("orders").doc(orderId).get()
    if (!orderDoc.exists) {
      return new Response(JSON.stringify({ error: "Commande introuvable" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Créer le rating
    const ratingRef = admin.firestore().collection("ratings").doc()
    await ratingRef.set({
      orderId,
      reviewerId,
      reviewerRole,
      revieweeId,
      revieweeRole,
      rating,
      comment: comment || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    const createdRating: Rating = {
      id: ratingRef.id,
      orderId,
      reviewerId,
      reviewerRole,
      revieweeId,
      revieweeRole,
      rating,
      comment,
    }

    return new Response(JSON.stringify({ success: true, rating: createdRating }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[POST /api/ratings] Error:", error)
    return new Response(JSON.stringify({ error: "Erreur lors de la création du rating" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
