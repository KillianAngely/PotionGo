"use client"
import { useEffect, useMemo, useState } from "react"
import { AnalyticsRepository } from "../../00_INFRA/Repositories/Analytics/AnalyticsRepository"
import {
  AnalyticsSnapshot,
  ForecastPoint,
  OrderPerDay,
} from "../../00_INFRA/types/AnalyticsSnapshot"

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Agrège toutes les statuses d'un même jour en un total. */
function buildDailyTotals(rows: OrderPerDay[]): Array<{ day: string; count: number }> {
  const map = new Map<string, number>()
  for (const row of rows) {
    map.set(row.day, (map.get(row.day) ?? 0) + Number(row.order_count))
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }))
}

/**
 * Génère exactement `days` jours consécutifs se terminant à aujourd'hui
 * et remplit avec les valeurs connues (0 pour les jours sans données).
 * Cela garantit que les graphiques affichent toujours toute la plage.
 */
function fillDateRange(
  data: Array<{ day: string; count: number }>,
  days: number,
): Array<{ day: string; count: number }> {
  const map = new Map(data.map((d) => [d.day, d.count]))
  const result: Array<{ day: string; count: number }> = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const day = d.toISOString().slice(0, 10)
    result.push({ day, count: map.get(day) ?? 0 })
  }
  return result
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BarChart({
  data,
  color,
  label,
}: {
  data: Array<{ day: string; count: number }>
  color: string
  label: string
}) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <div className="flex items-end gap-1 h-28">
        {data.map((d) => {
          const heightPct = Math.max(4, Math.round((d.count / max) * 100))
          return (
            <div key={d.day} className="group relative flex flex-1 flex-col items-center">
              <div
                className={`w-full rounded-t ${color} transition-all`}
                style={{ height: `${heightPct}%` }}
              />
              <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-fg px-1.5 py-0.5 text-xs text-bg opacity-0 group-hover:opacity-100">
                {d.day.slice(5)} — {d.count}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>{data[0]?.day.slice(5)}</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  )
}

function ForecastChart({
  history,
  forecast,
}: {
  history: Array<{ day: string; count: number }>
  forecast: ForecastPoint[]
}) {
  const combined = [
    ...history.map((h) => ({ day: h.day, value: h.count, predicted: false })),
    ...forecast.map((f) => ({ day: f.day, value: f.predicted, predicted: true })),
  ]
  const max = Math.max(...combined.map((d) => d.value), 1)

  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        Tendance + prévision 7 jours
      </p>
      <p className="mb-3 text-xs text-muted">
        Régression linéaire calculée lors du traitement batch BigQuery
      </p>
      <div className="flex items-end gap-1 h-28">
        {combined.map((d) => {
          const heightPct = Math.max(4, Math.round((d.value / max) * 100))
          return (
            <div key={d.day} className="group relative flex flex-1 flex-col items-center">
              <div
                className={`w-full rounded-t transition-all ${
                  d.predicted ? "bg-accent/40 border border-dashed border-accent" : "bg-accent2"
                }`}
                style={{ height: `${heightPct}%` }}
              />
              <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-fg px-1.5 py-0.5 text-xs text-bg opacity-0 group-hover:opacity-100">
                {d.day.slice(5)} — {d.value}
                {d.predicted ? " (prédit)" : ""}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded bg-accent2" />
          Historique
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded border border-dashed border-accent bg-accent/40" />
          Prévision (régression linéaire)
        </span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const repo = useMemo(() => new AnalyticsRepository(), [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null)

  useEffect(() => {
    repo
      .getLatestSnapshot()
      .then(setSnapshot)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false))
  }, [repo])

  const dailyTotals = useMemo(() => buildDailyTotals(snapshot?.ordersPerDay ?? []), [snapshot])
  const recentTotals = useMemo(() => fillDateRange(dailyTotals, 14), [dailyTotals])
  const forecastHistory = useMemo(() => fillDateRange(dailyTotals, 10), [dailyTotals])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Chargement des données analytiques BigQuery...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-red-500">
        {error}
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-semibold text-muted">Aucune donnée analytique disponible</p>
        <p className="mt-2 text-xs text-muted">
          La Cloud Function <code className="text-accent">weeklyAnalytics</code> s&apos;exécute
          chaque lundi à 02h00. Elle requête BigQuery (miroir Firestore via l&apos;extension
          Firebase) et stocke un snapshot ici.
        </p>
        <p className="mt-3 text-xs text-muted">
          Pour déclencher manuellement :{" "}
          <code className="text-accent">firebase functions:shell → weeklyAnalytics()</code>
        </p>
      </div>
    )
  }

  const totalOrders = dailyTotals.reduce((s, d) => s + d.count, 0)
  const deliveredCount = (snapshot.ordersPerDay ?? [])
    .filter((r) => r.status === "DELIVERED")
    .reduce((s, r) => s + Number(r.order_count), 0)

  return (
    <div className="grid gap-6">
      {/* En-tête */}
      <div className="rounded-2xl border border-border bg-bg/80 p-6">
        <h2 className="text-lg font-semibold">Analytics BigQuery</h2>
        <p className="mt-1 text-sm text-muted">
          Données issues de BigQuery via l&apos;extension Firebase Stream to BigQuery. Snapshot du{" "}
          <strong>
            {snapshot.period.from} → {snapshot.period.to}
          </strong>
          {snapshot.generatedAt && (
            <> · Généré le {new Date(snapshot.generatedAt).toLocaleString("fr-FR")}</>
          )}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Commandes (30 j)", value: totalOrders },
          { label: "Livrées", value: deliveredCount },
          {
            label: "Taux de livraison",
            value: totalOrders > 0 ? `${Math.round((deliveredCount / totalOrders) * 100)} %` : "—",
          },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Graphes */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <BarChart
            data={recentTotals}
            color="bg-accent"
            label="Commandes / jour (14 derniers j)"
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <ForecastChart history={forecastHistory} forecast={snapshot.forecast ?? []} />
        </div>
      </div>

      {/* Top produits */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Top 5 potions commandées
        </p>
        {snapshot.topProducts.length === 0 ? (
          <p className="text-sm text-muted">Aucune donnée</p>
        ) : (
          <div className="space-y-2">
            {snapshot.topProducts.map((p, i) => {
              const max = Number(snapshot.topProducts[0]?.total_quantity ?? 1)
              const width = `${Math.max(8, Math.round((Number(p.total_quantity) / max) * 100))}%`
              return (
                <div key={p.potion_id}>
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>
                      #{i + 1} {p.productName ?? p.potion_id}
                    </span>
                    <span>{p.total_quantity} unités</span>
                  </div>
                  <div className="h-2 rounded-full bg-border/70">
                    <div className="h-2 rounded-full bg-yellow-400" style={{ width }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Note technique */}
      <div className="rounded-2xl border border-border bg-bg/60 p-5 text-xs text-muted">
        <p className="font-semibold text-fg">Architecture big data — Ce2.5.4</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>
            <strong>Collecte</strong> : Extension Firebase <em>Stream Firestore to BigQuery</em> —
            ETL temps réel sans pipeline custom
          </li>
          <li>
            <strong>Stockage analytique</strong> : BigQuery (OLAP) séparé du Firestore opérationnel
            (OLTP)
          </li>
          <li>
            <strong>Traitement batch</strong> : Cloud Function schedulée (lundi 02h00) — SQL agrégé
            sur le changelog BigQuery
          </li>
          <li>
            <strong>Analyse prédictive</strong> : Régression linéaire (moindres carrés) sur les 30
            derniers jours → prévision J+7
          </li>
          <li>
            <strong>Cache opérationnel</strong> : Snapshot stocké dans Firestore pour servir le
            dashboard sans requêter BigQuery en temps réel
          </li>
        </ul>
      </div>
    </div>
  )
}
