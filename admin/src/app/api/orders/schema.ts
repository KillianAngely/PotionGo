import { z } from "zod"

const noHtmlTags = (value: string) => !/[<>]/.test(value)
const normalizeDriverId = (value: unknown) => {
  if (value === undefined || value === null) return null

  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed === "" ? null : trimmed
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id?: unknown }).id === "string"
  ) {
    const refId = (value as { id: string }).id.trim()
    return refId === "" ? null : refId
  }

  return value
}
const normalizeDriverStart = (value: unknown) => {
  if (value === undefined || value === null) return null
  if (typeof value !== "object") return value

  const candidate = value as { address?: unknown; lat?: unknown; lng?: unknown }
  const address = typeof candidate.address === "string" ? candidate.address.trim() : undefined
  const isZeroCoords = candidate.lat === 0 && candidate.lng === 0

  if ((!address || address.length === 0) && isZeroCoords) {
    return null
  }

  if (address === "") {
    return {
      ...candidate,
      address: undefined,
    }
  }

  return value
}

export const orderStatusEnum = z.enum([
  "PENDING",
  "ASSIGNED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
])

export const orderSchema = z.object({
  customerId: z.string().min(1),
  driverId: z.preprocess(normalizeDriverId, z.string().nullable()),
  status: orderStatusEnum,
  items: z
    .array(
      z.object({
        potionId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  driverStart: z.preprocess(
    normalizeDriverStart,
    z
      .object({
        address: z.string().min(1).refine(noHtmlTags, "Adresse de départ invalide").optional(),
        lat: z.number(),
        lng: z.number(),
      })
      .nullable(),
  ),
  dropoff: z.object({
    address: z.string().min(1).refine(noHtmlTags, "Adresse de livraison invalide"),
    lat: z.number(),
    lng: z.number(),
  }),
})

export type OrderInput = z.infer<typeof orderSchema>

export type Order = OrderInput & {
  id: string
}
