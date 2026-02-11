import { Product } from "../../types/Product"

export type ProductListQuery = {
  page?: number
  pageSize?: number
  search?: string
  mood?: string
  minPrice?: number
  maxPrice?: number
  sort?: string[]
}

export type ProductListResponse = {
  products: Product[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface IProductRepository {
  list(query?: ProductListQuery): Promise<ProductListResponse>
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
