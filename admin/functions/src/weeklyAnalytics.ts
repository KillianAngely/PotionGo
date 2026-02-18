import { onSchedule } from "firebase-functions/v2/scheduler"
import { firestore } from "firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { BigQuery } from "@google-cloud/bigquery"

const BQ_PROJECT_ID = process.env.GCLOUD_PROJECT ?? "potiongo-f85b7"
const BQ_DATASET = "firestore_export"

/**
 * Scheduled Cloud Function — exécutée chaque lundi à 02h00 (Europe/Paris).
 *
 * Rôle : requêter BigQuery (miroir Firestore via l'extension Stream to BigQuery)
 * pour agréger les données des 30 derniers jours, puis stocker le snapshot
 * analytique dans Firestore (collection `analytics_snapshots`).
 *
 * Choix technologiques :
 * - BigQuery  : base analytique OLAP, SQL standard, scalable sans config
 * - Extension Firebase → BigQuery : ETL temps réel sans pipeline custom
 * - Cloud Function schedulée : batch serverless, pas d'infra à maintenir
 */
export const weeklyAnalytics = onSchedule(
  {
    schedule: "every monday 02:00",
    timeZone: "Europe/Paris",
    region: "europe-west1",
  },
  async () => {
    const bigquery = new BigQuery({ projectId: BQ_PROJECT_ID, location: "EU" })
    const db = firestore()

    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const fromISO = thirtyDaysAgo.toISOString().slice(0, 10)
    const toISO = now.toISOString().slice(0, 10)

    try {
      /**
       * Ce2.5.1 — Traitement par lot (batch) des données historiques :
       * On interroge le changelog BigQuery généré par l'extension Firebase
       * pour reconstituer l'évolution des commandes jour par jour.
       */
      /**
       * On récupère la date de création + le statut final de chaque commande,
       * puis on agrège par jour de création. Cela garantit que les commandes
       * DELIVERED (mise à jour via UPDATE) sont bien comptabilisées.
       */
      const [ordersPerDayRows] = await bigquery.query(`
        SELECT
          FORMAT_DATE('%Y-%m-%d', DATE(created_at)) AS day,
          latest_status                              AS status,
          COUNT(*)                                   AS order_count
        FROM (
          SELECT
            document_name,
            MIN(CASE WHEN operation IN ('CREATE', 'IMPORT') THEN timestamp ELSE NULL END) AS created_at,
            ARRAY_AGG(JSON_VALUE(data, '$.status') ORDER BY timestamp DESC LIMIT 1)[OFFSET(0)] AS latest_status
          FROM \`${BQ_PROJECT_ID}.${BQ_DATASET}.orders_raw_changelog\`
          WHERE operation != 'DELETE'
          GROUP BY document_name
        )
        WHERE created_at >= TIMESTAMP('${fromISO}') AND created_at IS NOT NULL
        GROUP BY day, status
        ORDER BY day ASC
      `)

      /**
       * Ce2.5.3 — Analyse descriptive :
       * Top 5 produits par quantité totale commandée sur les commandes livrées.
       * JSON_QUERY_ARRAY décompose le champ items (JSON array) en lignes
       * individuelles — opération impossible en Firestore sans lecture totale.
       */
      const [topProductsRows] = await bigquery.query(`
        SELECT
          JSON_VALUE(item, '$.potionId') AS potion_id,
          SUM(CAST(JSON_VALUE(item, '$.quantity') AS INT64)) AS total_quantity
        FROM (
          SELECT data
          FROM \`${BQ_PROJECT_ID}.${BQ_DATASET}.orders_raw_changelog\`
          WHERE operation != 'DELETE'
          QUALIFY ROW_NUMBER() OVER (PARTITION BY document_name ORDER BY timestamp DESC) = 1
        ),
        UNNEST(JSON_QUERY_ARRAY(data, '$.items')) AS item
        WHERE JSON_VALUE(data, '$.status') = 'DELIVERED'
        GROUP BY potion_id
        ORDER BY total_quantity DESC
        LIMIT 5
      `)

      /**
       * Ce2.5.3 — Analyse prédictive (régression linéaire) :
       * Calcule la tendance linéaire du nombre de commandes par jour
       * pour produire une prévision sur les 7 prochains jours.
       * La prédiction est stockée dans le snapshot pour affichage dashboard.
       */
      const dailyTotals = buildDailyTotals(
        ordersPerDayRows as Array<{ day: string; status: string; order_count: number }>,
      )
      const forecast = computeLinearForecast(dailyTotals, 7)

      const snapshot = {
        generatedAt: FieldValue.serverTimestamp(),
        period: { from: fromISO, to: toISO },
        ordersPerDay: ordersPerDayRows,
        topProducts: topProductsRows,
        forecast,
      }

      await db.collection("analytics_snapshots").add(snapshot)
      console.log(`[weeklyAnalytics] Snapshot sauvegardé — période ${fromISO} → ${toISO}`)
    } catch (error) {
      console.error("[weeklyAnalytics] Erreur lors du traitement BigQuery:", error)
      throw error
    }
  },
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Agrège les lignes par jour (toutes statuses confondus). */
function buildDailyTotals(
  rows: Array<{ day: string; status: string; order_count: number }>,
): Array<{ day: string; count: number }> {
  const map = new Map<string, number>()
  for (const row of rows) {
    map.set(row.day, (map.get(row.day) ?? 0) + Number(row.order_count))
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }))
}

/**
 * Régression linéaire simple (moindres carrés) sur les totaux journaliers.
 * Prédit les `horizonDays` prochains jours.
 */
function computeLinearForecast(
  series: Array<{ day: string; count: number }>,
  horizonDays: number,
): Array<{ day: string; predicted: number }> {
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
  const result: Array<{ day: string; predicted: number }> = []

  for (let i = 1; i <= horizonDays; i++) {
    const d = new Date(lastDate)
    d.setDate(d.getDate() + i)
    const predicted = Math.max(0, Math.round(intercept + slope * (n - 1 + i)))
    result.push({ day: d.toISOString().slice(0, 10), predicted })
  }

  return result
}