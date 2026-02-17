"use client"

import { useEffect, useMemo, useState } from "react"
import { DriverStatsRepository } from "../../00_INFRA/Repositories/Driver/DriverStatsRepository"
import { DriverStats, DriverStatsResponse } from "../../00_INFRA/types/DriverStats"

type SortField = "name" | "totalDeliveries" | "revenue" | "acceptanceRate" | "averageRating"
type SortDir = "asc" | "desc"

export default function DriversPage() {
  const repo = useMemo(() => new DriverStatsRepository(), [])
  const [data, setData] = useState<DriverStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>("totalDeliveries")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await repo.getStats()
        setData(result)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de chargement")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [repo])

  const sortedDrivers = useMemo(() => {
    if (!data) return []
    return [...data.drivers].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      const numA = Number(aVal)
      const numB = Number(bVal)
      return sortDir === "asc" ? numA - numB : numB - numA
    })
  }, [data, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const sortIndicator = (field: SortField) => {
    if (field !== sortField) return ""
    return sortDir === "asc" ? " ↑" : " ↓"
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Livreurs</p>
        <h2 className="text-xl font-semibold">Statistiques des livreurs</h2>
      </div>

      {loading && <p className="text-sm text-muted">Chargement...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Total livreurs" value={String(data.summary.totalDrivers)} />
            <SummaryCard label="Revenus totaux" value={`${data.summary.totalRevenue.toFixed(2)} €`} />
            <SummaryCard
              label="Taux acceptation moyen"
              value={`${data.summary.averageAcceptanceRate.toFixed(1)} %`}
            />
            <SummaryCard
              label="Note moyenne"
              value={data.summary.averageRating > 0 ? `${data.summary.averageRating.toFixed(1)} / 5` : "N/A"}
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-bg/80 text-left text-xs uppercase tracking-[0.2em] text-muted">
                <tr>
                  <th className="cursor-pointer px-4 py-3" onClick={() => handleSort("name")}>
                    Nom{sortIndicator("name")}
                  </th>
                  <th className="px-4 py-3">Email</th>
                  <th
                    className="cursor-pointer px-4 py-3 text-right"
                    onClick={() => handleSort("totalDeliveries")}
                  >
                    Livraisons{sortIndicator("totalDeliveries")}
                  </th>
                  <th className="cursor-pointer px-4 py-3 text-right" onClick={() => handleSort("revenue")}>
                    Revenus{sortIndicator("revenue")}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-right"
                    onClick={() => handleSort("acceptanceRate")}
                  >
                    Acceptation{sortIndicator("acceptanceRate")}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-right"
                    onClick={() => handleSort("averageRating")}
                  >
                    Note{sortIndicator("averageRating")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {sortedDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      Aucun livreur trouvé
                    </td>
                  </tr>
                ) : (
                  sortedDrivers.map((driver) => (
                    <tr key={driver.uid} className="transition hover:bg-bg/80">
                      <td className="px-4 py-3 font-medium">{driver.name}</td>
                      <td className="px-4 py-3 text-muted">{driver.email}</td>
                      <td className="px-4 py-3 text-right">{driver.totalDeliveries}</td>
                      <td className="px-4 py-3 text-right">{driver.revenue.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-right">
                        <AcceptanceRateBadge rate={driver.acceptanceRate} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {driver.totalRatings > 0 ? (
                          <span>
                            <span className="text-yellow-500">★</span> {driver.averageRating.toFixed(1)}{" "}
                            <span className="text-muted">({driver.totalRatings})</span>
                          </span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-accent">{value}</p>
    </div>
  )
}

function AcceptanceRateBadge({ rate }: { rate: number }) {
  let colorClass = "text-green-500"
  if (rate < 50) colorClass = "text-red-500"
  else if (rate < 75) colorClass = "text-yellow-500"
  return <span className={`font-semibold ${colorClass}`}>{rate.toFixed(1)} %</span>
}
