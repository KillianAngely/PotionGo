import { Product } from "../../types/Product"

export interface IProductRepository {
  findAll(): Promise<Product[] | null>
  findById(productId: string): Promise<Product | null>
  create(payload: {
    name: string
    mood: string
    price: number
    description?: string
  }): Promise<Product>
  removeById(productId: string): Promise<void>
}
