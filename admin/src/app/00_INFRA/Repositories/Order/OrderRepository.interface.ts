import { Order, OrderStatus } from "../../types/Order"

export type OrderListQuery = {
  page?: number
  pageSize?: number
  status?: string
  search?: string
  minTotal?: number
  maxTotal?: number
  sort?: string[]
}

export type OrderListResponse = {
  orders: Order[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface IOrderRepository {
  list(query?: OrderListQuery): Promise<OrderListResponse>
  findAll(): Promise<Order[] | null>
  findById(orderId: string): Promise<Order | null>
  // Create a modifier/supprimer
  create(payload: {
    customerId: string
    driverId?: string | null
    status: OrderStatus
    items: { potionId: string; quantity: number }[]
    dropoff: { address: string; lat: number; lng: number }
  }): Promise<Order>
  removeById(orderId: string): Promise<void>
}
