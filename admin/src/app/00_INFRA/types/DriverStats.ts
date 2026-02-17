export type DriverStats = {
  uid: string
  name: string
  email: string
  totalDeliveries: number
  revenue: number
  acceptanceRate: number
  averageRating: number
  totalRatings: number
}

export type DriverStatsResponse = {
  drivers: DriverStats[]
  summary: {
    totalDrivers: number
    totalRevenue: number
    averageAcceptanceRate: number
    averageRating: number
  }
}
