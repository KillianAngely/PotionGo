import { Order, OrderStatus } from "../../types/Order"
import { IOrderRepository } from "./OrderRepository.interface"

export class OrderRepository implements IOrderRepository {
  private baseUrl: string

  constructor() {
    this.baseUrl = "/api/orders"
  }

  async findAll(): Promise<Order[] | null> {
    try {
      const response = await fetch(this.baseUrl, { credentials: "include" })
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des commandes")
      }
      const data = await response.json()
      return data.orders || null
    } catch (error) {
      console.error("Error finding all orders:", error)
      return null
    }
  }

  async findById(orderId: string): Promise<Order | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${orderId}`, {
        credentials: "include",
      })
      if (response.status === 404) {
        return null
      }
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération de la commande")
      }
      const data = await response.json()
      return data.order || null
    } catch (error) {
      console.error(`Error finding order by id ${orderId}:`, error)
      return null
    }
  }

  async create(payload: {
    customerId: string
    driverId?: string | null
    status: OrderStatus
    items: { potionId: string; quantity: number }[]
    driverStart?: { address?: string; lat: number; lng: number } | null
    dropoff: { address: string; lat: number; lng: number }
  }): Promise<Order> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message = data?.error || "Erreur lors de la création de la commande"
        throw new Error(message)
      }

      const data = await response.json()
      return data.order as Order
    } catch (error) {
      console.error("Error creating order:", error)
      throw error
    }
  }

  async removeById(orderId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${orderId}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la commande")
      }
    } catch (error) {
      console.error(`Error deleting order ${orderId}:`, error)
      throw error
    }
  }
}
