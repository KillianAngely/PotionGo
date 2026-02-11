import { DashboardStats, IDashboardRepository } from "./DashboardRepository.interface"
import { assertApiResponse } from "../_utils/http"

export class DashboardRepository implements IDashboardRepository {
  private baseUrl: string

  constructor() {
    this.baseUrl = "/api/dashboard"
  }

  async getStats(): Promise<DashboardStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, { credentials: "include" })
      await assertApiResponse(response, "Erreur lors de la récupération des statistiques")
      const data = await response.json()
      return {
        totals: data.totals,
        roles: data.roles,
        orderStatuses: data.orderStatuses,
        estimatedUnitsSold: data.estimatedUnitsSold,
        ratings: data.ratings,
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
      throw error
    }
  }
}
