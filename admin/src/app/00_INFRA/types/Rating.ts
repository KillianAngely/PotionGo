export type Rating = {
  id: string
  orderId: string
  reviewerId: string
  reviewerRole: "CUSTOMER" | "DRIVER"
  revieweeId: string
  revieweeRole: "CUSTOMER" | "DRIVER"
  rating: number
  comment?: string
  createdAt?: Date
  updatedAt?: Date
}

export type UserRatingStats = {
  averageRating: number
  totalRatings: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}
