import { DriverStatsResponse } from "../../types/DriverStats"

export interface IDriverStatsRepository {
  getStats(): Promise<DriverStatsResponse>
}
