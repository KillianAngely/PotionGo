export type OrderPerDay = {
  day: string
  status: string
  order_count: number
}

export type TopProduct = {
  potion_id: string
  total_quantity: number
  /** Nom enrichi côté client via ProductRepository */
  productName?: string
}

export type ForecastPoint = {
  day: string
  predicted: number
}

export type AnalyticsSnapshot = {
  id: string
  generatedAt: string | null
  period: { from: string; to: string }
  ordersPerDay: OrderPerDay[]
  topProducts: TopProduct[]
  forecast: ForecastPoint[]
}
