import { z } from "zod"

const noHtmlTags = (value: string) => !/[<>]/.test(value)

const normalizeCreatedAt = (value: unknown) => {
  if (value === undefined || value === null) return undefined

  if (typeof value === "number" && Number.isFinite(value)) return value

  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.getTime()
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    try {
      const millis = (value as { toMillis: () => unknown }).toMillis()
      if (typeof millis === "number" && Number.isFinite(millis)) return millis
    } catch {
      return value
    }
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as { seconds?: unknown }).seconds === "number"
  ) {
    const timestampLike = value as Record<string, unknown>
    const seconds = timestampLike.seconds as number
    const nanos = typeof timestampLike.nanoseconds === "number" ? timestampLike.nanoseconds : 0
    return Math.round(seconds * 1000 + nanos / 1_000_000)
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "_seconds" in value &&
    typeof (value as { _seconds?: unknown })._seconds === "number"
  ) {
    const timestampLike = value as Record<string, unknown>
    const seconds = timestampLike._seconds as number
    const nanos = typeof timestampLike._nanoseconds === "number" ? timestampLike._nanoseconds : 0
    return Math.round(seconds * 1000 + nanos / 1_000_000)
  }

  return value
}

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

  if (address !== undefined) {
    return {
      ...candidate,
      address,
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
  customerId: z.string().trim().min(1),
  driverId: z.preprocess(normalizeDriverId, z.string().nullable()),
  status: orderStatusEnum,
  items: z
    .array(
      z.object({
        potionId: z.string().trim().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  driverStart: z.preprocess(
    normalizeDriverStart,
    z
      .object({
        address: z
          .string()
          .trim()
          .min(1)
          .refine(noHtmlTags, "Adresse de départ invalide")
          .optional(),
        lat: z.number(),
        lng: z.number(),
      })
      .nullable(),
  ),
  dropoff: z.object({
    address: z.string().trim().min(1).refine(noHtmlTags, "Adresse de livraison invalide"),
    lat: z.number(),
    lng: z.number(),
  }),
  validationCode: z.string().length(6).optional(),
  createdAt: z.preprocess(normalizeCreatedAt, z.number().finite().optional()),
})

export type OrderInput = z.infer<typeof orderSchema>

export type Order = OrderInput & {
  id: string
}
