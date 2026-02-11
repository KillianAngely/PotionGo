import { Rating, UserRatingStats } from "../../types/Rating"

export type RatingListQuery = {
  page?: number
  pageSize?: number
  orderId?: string
  revieweeId?: string
  minRating?: number
  maxRating?: number
}

export type RatingListResponse = {
  ratings: Rating[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type UserRatingsResponse = {
  ratings: Rating[]
  stats: UserRatingStats
}

export interface IRatingRepository {
  list(query?: RatingListQuery): Promise<RatingListResponse>
  findAll(): Promise<Rating[] | null>
  findById(ratingId: string): Promise<Rating | null>
  findByUserId(userId: string): Promise<UserRatingsResponse>
  create(payload: {
    orderId: string
    reviewerId: string
    reviewerRole: "CUSTOMER" | "DRIVER"
    revieweeId: string
    revieweeRole: "CUSTOMER" | "DRIVER"
    rating: number
    comment?: string
  }): Promise<Rating>
  removeById(ratingId: string): Promise<void>
}
