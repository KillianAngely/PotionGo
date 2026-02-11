import { z } from "zod"

export const ratingCreateSchema = z.object({
  orderId: z.string().min(1, "Order ID requis"),
  reviewerId: z.string().min(1, "Reviewer ID requis"),
  reviewerRole: z.enum(["CUSTOMER", "DRIVER"]),
  revieweeId: z.string().min(1, "Reviewee ID requis"),
  revieweeRole: z.enum(["CUSTOMER", "DRIVER"]),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export const ratingUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(500).optional(),
})
