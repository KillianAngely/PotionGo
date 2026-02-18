import { IAnalyticsRepository } from "./AnalyticsRepository.interface"
import { AnalyticsSnapshot } from "../../types/AnalyticsSnapshot"
import { assertApiResponse } from "../_utils/http"

export class AnalyticsRepository implements IAnalyticsRepository {
  private baseUrl = "/api/analytics"

  async getLatestSnapshot(): Promise<AnalyticsSnapshot | null> {
    const response = await fetch(`${this.baseUrl}/snapshots`, { credentials: "include" })
    await assertApiResponse(response, "Erreur lors de la récupération du snapshot analytique")
    const data = await response.json()
    return data.snapshot ?? null
  }
}
