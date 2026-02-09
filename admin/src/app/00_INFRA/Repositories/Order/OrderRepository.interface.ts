import { Order, OrderStatus } from "../../types/Order"

export interface IOrderRepository {
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
