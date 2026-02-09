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
}

export type OrderDropoff = {
    address: string
    lat: number
    lng: number
}

export type Order = {
    id: string
    customerId: string
    driverId: string | null
    status: OrderStatus
    items: OrderItem[]
    dropoff: OrderDropoff
}
