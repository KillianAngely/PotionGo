import { AnalyticsSnapshot } from "../../types/AnalyticsSnapshot"

export interface IAnalyticsRepository {
  getLatestSnapshot(): Promise<AnalyticsSnapshot | null>
}
