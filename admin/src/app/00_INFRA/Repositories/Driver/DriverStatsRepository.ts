import { DriverStatsResponse } from "../../types/DriverStats"
import { IDriverStatsRepository } from "./DriverStatsRepository.interface"
import { assertApiResponse, withCsrfHeaders } from "../_utils/http"

export class DriverStatsRepository implements IDriverStatsRepository {
  async getStats(): Promise<DriverStatsResponse> {
    const response = await fetch("/api/drivers/stats", {
      headers: withCsrfHeaders(),
    })
    await assertApiResponse(response, "Impossible de charger les statistiques des livreurs")
    const data = await response.json()
    return data
  }
}
