import admin from "../../../../../config/firebase-admin"
import { buildAuthErrorResponse, requireAdmin } from "../../_utils/auth"

type OrderPerDayRow = { day: string; status: string; order_count: number }
type TopProductRow = { potion_id: string; total_quantity: number; productName?: string }
type ForecastPoint = { day: string; predicted: number }

// ─── Helpers (mirrored from weeklyAnalytics Cloud Function) ───────────────────

function buildDailyTotals(rows: OrderPerDayRow[]): Array<{ day: string; count: number }> {
  const map = new Map<string, number>()
  for (const row of rows) {
    map.set(row.day, (map.get(row.day) ?? 0) + Number(row.order_count))
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }))
}

function computeLinearForecast(
  series: Array<{ day: string; count: number }>,
  horizonDays: number,
): ForecastPoint[] {
  const n = series.length
  if (n < 2) return []
  const ys = series.map((p) => p.count)
  const sumX = (n * (n - 1)) / 2
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXX = (n * (n - 1) * (2 * n - 1)) / 6
  const sumXY = ys.reduce((acc, y, i) => acc + i * y, 0)
  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return []
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  const lastDate = new Date(series[n - 1].day)
  const result: ForecastPoint[] = []
  for (let i = 1; i <= horizonDays; i++) {
    const d = new Date(lastDate)
    d.setDate(d.getDate() + i)
    result.push({
      day: d.toISOString().slice(0, 10),
      predicted: Math.max(0, Math.round(intercept + slope * (n - 1 + i))),
    })
  }
  return result
}

/**
 * Construit ordersPerDay, topProducts et forecast directement depuis Firestore.
 * Utilisé en fallback quand le snapshot BigQuery est vide ou inexistant.
 */
async function buildFirestoreAnalytics(fromMs: number): Promise<{
  ordersPerDay: OrderPerDayRow[]
  topProducts: TopProductRow[]
  forecast: ForecastPoint[]
}> {
  const ordersSnap = await admin.firestore().collection("orders").get()

  const dayStatusMap = new Map<string, Map<string, number>>()
  const itemsByPotion = new Map<string, number>()

  for (const doc of ordersSnap.docs) {
    const data = doc.data()
    const createdAt = typeof data.createdAt === "number" ? data.createdAt : null
    if (!createdAt || createdAt < fromMs) continue

    const day = new Date(createdAt).toISOString().slice(0, 10)
    const status = typeof data.status === "string" ? data.status : "UNKNOWN"

    if (!dayStatusMap.has(day)) dayStatusMap.set(day, new Map())
    const statusMap = dayStatusMap.get(day)!
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1)

    if (status === "DELIVERED" && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.potionId) {
          itemsByPotion.set(
            item.potionId,
            (itemsByPotion.get(item.potionId) ?? 0) + (Number(item.quantity) || 0),
          )
        }
      }
    }
  }

  const ordersPerDay: OrderPerDayRow[] = []
  for (const [day, statusMap] of dayStatusMap.entries()) {
    for (const [status, count] of statusMap.entries()) {
      ordersPerDay.push({ day, status, order_count: count })
    }
  }
  ordersPerDay.sort((a, b) => a.day.localeCompare(b.day))

  const topProducts: TopProductRow[] = [...itemsByPotion.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([potion_id, total_quantity]) => ({ potion_id, total_quantity }))

  const forecast = computeLinearForecast(buildDailyTotals(ordersPerDay), 7)

  return { ordersPerDay, topProducts, forecast }
}

/** Enrichit chaque entrée topProducts avec le vrai nom du produit depuis Firestore. */
async function enrichProductNames(topProducts: TopProductRow[]): Promise<TopProductRow[]> {
  if (topProducts.length === 0) return topProducts
  const refs = topProducts.map((p) => admin.firestore().collection("products").doc(p.potion_id))
  const snaps = await admin.firestore().getAll(...refs)
  const nameMap = new Map<string, string>()
  for (const snap of snaps) {
    if (snap.exists) {
      const name = snap.data()?.name
      if (typeof name === "string") nameMap.set(snap.id, name)
    }
  }
  return topProducts.map((p) => ({ ...p, productName: nameMap.get(p.potion_id) ?? undefined }))
}

// ─── Route ────────────────────────────────────────────────────────────────────

/**
 * GET /api/analytics/snapshots
 *
 * Retourne le snapshot analytique le plus récent.
 * Si le snapshot BigQuery est vide (ordersPerDay=[]), tombe en fallback
 * sur un calcul direct depuis Firestore pour que le dashboard soit toujours
 * alimenté, même avant la première exécution de weeklyAnalytics.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return buildAuthErrorResponse(auth)
  }

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const fromISO = thirtyDaysAgo.toISOString().slice(0, 10)
    const toISO = now.toISOString().slice(0, 10)

    const bqSnap = await admin
      .firestore()
      .collection("analytics_snapshots")
      .orderBy("generatedAt", "desc")
      .limit(1)
      .get()

    let id = "firestore-live"
    let generatedAt: string | null = null
    let period = { from: fromISO, to: toISO }
    let ordersPerDay: OrderPerDayRow[] = []
    let topProducts: TopProductRow[] = []
    let forecast: ForecastPoint[] = []

    if (!bqSnap.empty) {
      const doc = bqSnap.docs[0]
      const data = doc.data()
      id = doc.id
      generatedAt = data.generatedAt?.toDate?.()?.toISOString() ?? null
      period = data.period ?? { from: fromISO, to: toISO }
      ordersPerDay = data.ordersPerDay ?? []
      topProducts = data.topProducts ?? []
      forecast = data.forecast ?? []
    }

    // Fallback Firestore quand BigQuery n'a pas encore de données
    if (ordersPerDay.length === 0) {
      const fs = await buildFirestoreAnalytics(thirtyDaysAgo.getTime())
      ordersPerDay = fs.ordersPerDay
      topProducts = fs.topProducts
      forecast = fs.forecast
    }

    topProducts = await enrichProductNames(topProducts)

    return new Response(
      JSON.stringify({
        success: true,
        snapshot: { id, generatedAt, period, ordersPerDay, topProducts, forecast },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("[GET /api/analytics/snapshots] Error:", error)
    return new Response(
      JSON.stringify({ error: "Impossible de charger le snapshot analytique" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
