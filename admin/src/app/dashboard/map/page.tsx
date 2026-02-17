"use client"

import Script from "next/script"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActiveOrder } from "../../00_INFRA/types/ActiveOrder"
import { assertApiResponse, withCsrfHeaders } from "../../00_INFRA/Repositories/_utils/http"

const REFRESH_INTERVAL = 10_000
const MAP_CENTER = { lat: 46.6, lng: 2.3 }
const MAP_ZOOM = 6

const COLORS = [
  "#4285F4",
  "#EA4335",
  "#34A853",
  "#FBBC04",
  "#FF6D01",
  "#46BDC6",
  "#7B1FA2",
  "#C2185B",
  "#00897B",
  "#5C6BC0",
  "#8D6E63",
  "#F06292",
]

export default function LiveMapPage() {
  const [orders, setOrders] = useState<ActiveOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const polylinesRef = useRef<google.maps.Polyline[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders/active", {
        headers: withCsrfHeaders(),
      })
      await assertApiResponse(response, "Erreur lors du chargement des commandes actives")
      const data = await response.json()
      setOrders(data.orders ?? [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    intervalRef.current = setInterval(fetchOrders, REFRESH_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchOrders])

  // Initialize map once Google Maps is loaded
  useEffect(() => {
    if (!mapsReady || !mapRef.current || googleMapRef.current) return

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      mapId: "live-map",
    })

    infoWindowRef.current = new google.maps.InfoWindow()
  }, [mapsReady])

  // Update markers when orders change
  useEffect(() => {
    if (!googleMapRef.current || !mapsReady) return

    // Clear old markers and polylines
    for (const marker of markersRef.current) {
      marker.map = null
    }
    markersRef.current = []
    for (const polyline of polylinesRef.current) {
      polyline.setMap(null)
    }
    polylinesRef.current = []

    const map = googleMapRef.current

    orders.forEach((order, index) => {
      const color = COLORS[index % COLORS.length]
      const hasDriverLoc = order.driverLat !== 0 || order.driverLng !== 0
      const dropoffPos = { lat: order.dropoffLat, lng: order.dropoffLng }

      // Driver marker
      if (hasDriverLoc) {
        const driverPos = { lat: order.driverLat, lng: order.driverLng }

        const driverPin = document.createElement("div")
        driverPin.style.cssText = `width:26px;height:26px;border-radius:50%;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.3);`
        driverPin.textContent = "D"

        const driverMarker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: driverPos,
          content: driverPin,
          title: `Livreur: ${order.driverName}`,
        })
        driverMarker.addListener("click", () => {
          showInfoWindow(order, driverPos)
        })
        markersRef.current.push(driverMarker)

        // Polyline driver → dropoff
        const polyline = new google.maps.Polyline({
          path: [driverPos, dropoffPos],
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 3,
          geodesic: true,
          map,
        })
        polylinesRef.current.push(polyline)
      }

      // Dropoff marker
      const dropoffPin = document.createElement("div")
      dropoffPin.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3);`

      const dropoffMarker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: dropoffPos,
        content: dropoffPin,
        title: `Client: ${order.customerName}`,
      })
      dropoffMarker.addListener("click", () => {
        showInfoWindow(order, dropoffPos)
      })
      markersRef.current.push(dropoffMarker)
    })
  }, [orders, mapsReady])

  const showInfoWindow = (order: ActiveOrder, position: google.maps.LatLngLiteral) => {
    if (!infoWindowRef.current || !googleMapRef.current) return
    setSelectedOrderId(order.orderId)
    infoWindowRef.current.setContent(
      `<div style="color:#333;max-width:200px">
        <p style="font-weight:bold;margin:0 0 4px">Livreur: ${order.driverName}</p>
        <p style="font-size:12px;margin:2px 0">Client: ${order.customerName}</p>
        <p style="font-size:12px;margin:2px 0">Adresse: ${order.dropoffAddress || "N/A"}</p>
        <p style="font-size:12px;margin:2px 0">Statut: ${order.status}</p>
      </div>`,
    )
    infoWindowRef.current.setPosition(position)
    infoWindowRef.current.open(googleMapRef.current)
  }

  if (!apiKey) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Carte live
          </p>
          <h2 className="text-xl font-semibold">Suivi des livraisons en temps réel</h2>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-red-500">
            Clé API Google Maps manquante. Ajoutez <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> dans{" "}
            <code>.env.local</code>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`}
        strategy="afterInteractive"
        onReady={() => setMapsReady(true)}
        onError={() => setError("Impossible de charger Google Maps")}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Carte live
          </p>
          <h2 className="text-xl font-semibold">Suivi des livraisons en temps réel</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">
            {orders.length} commande{orders.length !== 1 ? "s" : ""} active
            {orders.length !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div
          className="relative overflow-hidden rounded-2xl border border-border"
          style={{ height: "600px" }}
        >
          {!mapsReady ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted">Chargement de la carte...</p>
            </div>
          ) : (
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Légende</h3>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">Aucune commande active</p>
          ) : (
            orders.map((order, index) => (
              <button
                key={order.orderId}
                type="button"
                onClick={() => {
                  const hasDriverLoc = order.driverLat !== 0 || order.driverLng !== 0
                  const pos = hasDriverLoc
                    ? { lat: order.driverLat, lng: order.driverLng }
                    : { lat: order.dropoffLat, lng: order.dropoffLng }
                  showInfoWindow(order, pos)
                  googleMapRef.current?.panTo(pos)
                  googleMapRef.current?.setZoom(14)
                }}
                className={`w-full rounded-xl border p-3 text-left text-sm transition hover:bg-bg/80 ${
                  selectedOrderId === order.orderId
                    ? "border-accent bg-bg/80"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{order.driverName}</span>
                </div>
                <p className="mt-1 text-xs text-muted">Client: {order.customerName}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {order.dropoffAddress ? order.dropoffAddress.slice(0, 50) : "Adresse inconnue"}
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
