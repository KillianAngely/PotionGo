import { z } from "zod"

export const orderStatusEnum = z.enum([
  "PENDING",
  "ASSIGNED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
])

export const orderSchema = z.object({
  customerId: z.string().min(1),
  driverId: z.string().nullable().optional(),
  status: orderStatusEnum,
  items: z
    .array(
      z.object({
        potionId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  dropoff: z.object({
    address: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
  }),
})

export type OrderInput = z.infer<typeof orderSchema>

export type Order = OrderInput & {
  id: string
}
