export type DashboardStats = {
  totals: { users: number; products: number; orders: number; ratings: number }
  roles: Record<string, number>
  orderStatuses: Record<string, number>
  estimatedUnitsSold: number
  ratings: {
    total: number
    average: number
    distribution: { 1: number; 2: number; 3: number; 4: number; 5: number }
  }
}

export interface IDashboardRepository {
  getStats(): Promise<DashboardStats>
}
