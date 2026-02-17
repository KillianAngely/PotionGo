import admin from "../../../../../config/firebase-admin"
import { buildAuthErrorResponse, requireAdmin } from "../../_utils/auth"

/**
 * GET /api/analytics/snapshots
 *
 * Retourne le snapshot analytique le plus récent stocké dans Firestore
 * par la Cloud Function `weeklyAnalytics` (source : BigQuery).
 *
 * Ce2.5.2 — Le stockage analytique est dans BigQuery (OLAP).
 * Firestore sert de cache opérationnel pour le dashboard.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return buildAuthErrorResponse(auth)
  }

  try {
    const snap = await admin
      .firestore()
      .collection("analytics_snapshots")
      .orderBy("generatedAt", "desc")
      .limit(1)
      .get()

    if (snap.empty) {
      return new Response(JSON.stringify({ success: true, snapshot: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const doc = snap.docs[0]
    const data = doc.data()

    return new Response(
      JSON.stringify({
        success: true,
        snapshot: {
          id: doc.id,
          generatedAt: data.generatedAt?.toDate?.()?.toISOString() ?? null,
          period: data.period ?? { from: null, to: null },
          ordersPerDay: data.ordersPerDay ?? [],
          topProducts: data.topProducts ?? [],
          forecast: data.forecast ?? [],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("[GET /api/analytics/snapshots] Error:", error)
    return new Response(JSON.stringify({ error: "Impossible de charger le snapshot analytique" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
