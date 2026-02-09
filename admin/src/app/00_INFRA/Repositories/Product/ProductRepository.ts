import { Product } from "../../types/Product"
import { IProductRepository } from "./ProductRepository.interface"

export class ProductRepository implements IProductRepository {
  private baseUrl: string

  constructor() {
    this.baseUrl = "/api/products"
  }

  async findAll(): Promise<Product[] | null> {
    try {
      const response = await fetch(this.baseUrl, { credentials: "include" })
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des produits")
      }
      const data = await response.json()
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
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération du produit")
      }
      const data = await response.json()
      return data.product || null
    } catch (error) {
      console.error(`Error finding product by id ${productId}:`, error)
      return null
    }
  }
}
