import { Product } from "../../types/Product"

export interface IProductRepository {
  findAll(): Promise<Product[] | null>
  findById(productId: string): Promise<Product | null>
}
