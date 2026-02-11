import { Order, OrderStatus } from "../../types/Order"
import {
  IOrderRepository,
  OrderListQuery,
  OrderListResponse,
} from "./OrderRepository.interface"
import { assertApiResponse, withCsrfHeaders } from "../_utils/http"

export class OrderRepository implements IOrderRepository {
  private baseUrl: string

  constructor() {
    this.baseUrl = "/api/orders"
  }

  async list(query: OrderListQuery = {}): Promise<OrderListResponse> {
    const params = new URLSearchParams()
    if (query.page) params.set("page", String(query.page))
    if (query.pageSize) params.set("pageSize", String(query.pageSize))
    if (query.status && query.status !== "all") params.set("status", query.status)
    if (query.search) params.set("search", query.search)
    if (typeof query.minTotal === "number" && Number.isFinite(query.minTotal)) {
      params.set("minTotal", String(query.minTotal))
    }
    if (typeof query.maxTotal === "number" && Number.isFinite(query.maxTotal)) {
      params.set("maxTotal", String(query.maxTotal))
    }
    if (query.sort && query.sort.length > 0) params.set("sort", query.sort.join(","))

    const url = params.size > 0 ? `${this.baseUrl}?${params.toString()}` : this.baseUrl
    const response = await fetch(url, { credentials: "include" })
    await assertApiResponse(response, "Erreur lors de la récupération des commandes")
    const data = await response.json()
    return {
      orders: data.orders ?? [],
      pagination: data.pagination ?? { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    }
  }

  async findAll(): Promise<Order[] | null> {
    try {
      const data = await this.list({ page: 1, pageSize: 500 })
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
      await assertApiResponse(response, "Erreur lors de la récupération de la commande")
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
        headers: withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      })
      await assertApiResponse(response, "Erreur lors de la création de la commande")

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
        headers: withCsrfHeaders(),
      })
      await assertApiResponse(response, "Erreur lors de la suppression de la commande")
    } catch (error) {
      console.error(`Error deleting order ${orderId}:`, error)
      throw error
    }
  }
}
