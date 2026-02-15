export enum OrderStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export type OrderItem = {
  potionId: string
  quantity: number
  potionName?: string
  potionImageUrl?: string
  unitPrice?: number | null
  lineTotal?: number | null
}

export type OrderDropoff = {
  address: string
  lat: number
  lng: number
}

export type Order = {
  id: string
  customerId: string
  customerName?: string
  driverId: string | null
  driverName?: string
  status: OrderStatus
  items: OrderItem[]
  totalPrice?: number | null
  driverStart?: {
    address?: string
    lat: number
    lng: number
  } | null
  dropoff: OrderDropoff
}
