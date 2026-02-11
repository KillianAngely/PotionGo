import { Product } from "../../types/Product"
import {
  IProductRepository,
  ProductListQuery,
  ProductListResponse,
} from "./ProductRepository.interface"
import { assertApiResponse, withCsrfHeaders } from "../_utils/http"

export class ProductRepository implements IProductRepository {
  private baseUrl: string

  constructor() {
    this.baseUrl = "/api/products"
  }

  async list(query: ProductListQuery = {}): Promise<ProductListResponse> {
    const params = new URLSearchParams()
    if (query.page) params.set("page", String(query.page))
    if (query.pageSize) params.set("pageSize", String(query.pageSize))
    if (query.search) params.set("search", query.search)
    if (query.mood && query.mood !== "all") params.set("mood", query.mood)
    if (typeof query.minPrice === "number" && Number.isFinite(query.minPrice)) {
      params.set("minPrice", String(query.minPrice))
    }
    if (typeof query.maxPrice === "number" && Number.isFinite(query.maxPrice)) {
      params.set("maxPrice", String(query.maxPrice))
    }
    if (query.sort && query.sort.length > 0) params.set("sort", query.sort.join(","))

    const url = params.size > 0 ? `${this.baseUrl}?${params.toString()}` : this.baseUrl
    const response = await fetch(url, { credentials: "include" })
    await assertApiResponse(response, "Erreur lors de la récupération des produits")
    const data = await response.json()
    return {
      products: data.products ?? [],
      pagination: data.pagination ?? { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    }
  }

  async findAll(): Promise<Product[] | null> {
    try {
      const data = await this.list({ page: 1, pageSize: 500 })
      return data.products || null
    } catch (error) {
      console.error("Error finding all products:", error)
      return null
    }
  }

  async findById(productId: string): Promise<Product | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}`, { credentials: "include" })
      if (response.status === 404) {
        return null
      }
      await assertApiResponse(response, "Erreur lors de la récupération du produit")
      const data = await response.json()
      return data.product || null
    } catch (error) {
      console.error(`Error finding product by id ${productId}:`, error)
      return null
    }
  }

  async create(payload: {
    name: string
    mood: string
    price: number
    description?: string
    imageUrl?: string
  }): Promise<Product> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        credentials: "include",
        headers: withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      })
      await assertApiResponse(response, "Erreur lors de la création du produit")

      const data = await response.json()
      return data.product as Product
    } catch (error) {
      console.error("Error creating product:", error)
      throw error
    }
  }

  async removeById(productId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}`, {
        method: "DELETE",
        credentials: "include",
        headers: withCsrfHeaders(),
      })
      await assertApiResponse(response, "Erreur lors de la suppression du produit")
    } catch (error) {
      console.error(`Error deleting product ${productId}:`, error)
      throw error
    }
  }
}
