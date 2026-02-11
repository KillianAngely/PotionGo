import { Rating } from "../../types/Rating"
import {
  IRatingRepository,
  RatingListQuery,
  RatingListResponse,
  UserRatingsResponse,
} from "./RatingRepository.interface"
import { assertApiResponse, withCsrfHeaders } from "../_utils/http"

export class RatingRepository implements IRatingRepository {
  private baseUrl: string

  constructor() {
    this.baseUrl = "/api/ratings"
  }

  async list(query: RatingListQuery = {}): Promise<RatingListResponse> {
    const params = new URLSearchParams()
    if (query.page) params.set("page", String(query.page))
    if (query.pageSize) params.set("pageSize", String(query.pageSize))
    if (query.orderId) params.set("orderId", query.orderId)
    if (query.revieweeId) params.set("revieweeId", query.revieweeId)
    if (query.minRating) params.set("minRating", String(query.minRating))
    if (query.maxRating) params.set("maxRating", String(query.maxRating))

    const url = params.size > 0 ? `${this.baseUrl}?${params.toString()}` : this.baseUrl
    const response = await fetch(url, { credentials: "include" })
    await assertApiResponse(response, "Erreur lors de la récupération des ratings")
    const data = await response.json()
    return {
      ratings: data.ratings ?? [],
      pagination: data.pagination ?? { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    }
  }

  async findAll(): Promise<Rating[] | null> {
    try {
      const data = await this.list({ page: 1, pageSize: 1000 })
      return data.ratings || null
    } catch (error) {
      console.error(`Error finding all ratings:`, error)
      return null
    }
  }

  async findById(ratingId: string): Promise<Rating | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${ratingId}`, { credentials: "include" })
      if (response.status === 404) {
        return null
      }
      await assertApiResponse(response, "Erreur lors de la récupération du rating")
      const data = await response.json()
      return data.rating || null
    } catch (error) {
      console.error(`Error finding rating by id ${ratingId}:`, error)
      return null
    }
  }

  async findByUserId(userId: string): Promise<UserRatingsResponse> {
    try {
      const response = await fetch(`/api/users/${userId}/ratings`, { credentials: "include" })
      await assertApiResponse(response, "Erreur lors de la récupération des ratings de l'utilisateur")
      const data = await response.json()
      return {
        ratings: data.ratings ?? [],
        stats: data.stats ?? { averageRating: 0, totalRatings: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      }
    } catch (error) {
      console.error(`Error finding ratings for user ${userId}:`, error)
      throw error
    }
  }

  async create(payload: {
    orderId: string
    reviewerId: string
    reviewerRole: "CUSTOMER" | "DRIVER"
    revieweeId: string
    revieweeRole: "CUSTOMER" | "DRIVER"
    rating: number
    comment?: string
  }): Promise<Rating> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        credentials: "include",
        headers: withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      })
      await assertApiResponse(response, "Erreur lors de la création du rating")

      const data = await response.json()
      return data.rating as Rating
    } catch (error) {
      console.error("Error creating rating:", error)
      throw error
    }
  }

  async removeById(ratingId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${ratingId}`, {
        method: "DELETE",
        credentials: "include",
        headers: withCsrfHeaders(),
      })
      await assertApiResponse(response, "Erreur lors de la suppression du rating")
    } catch (error) {
      console.error(`Error deleting rating ${ratingId}:`, error)
      throw error
    }
  }
}
