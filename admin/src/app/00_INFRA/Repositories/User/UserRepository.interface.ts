import { User, UserRole } from "../../types/User"

export type UserListQuery = {
  page?: number
  pageSize?: number
  role?: UserRole | "all"
  search?: string
  sort?: string[]
}

export type UserListResponse = {
  users: User[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface IUserRepository {
  list(query?: UserListQuery): Promise<UserListResponse>
  findAll(): Promise<User[] | null>
  findAllByRole(role: UserRole): Promise<User[] | null>
  findById(userId: string): Promise<User | null>
  create(payload: {
    email: string
    firstName: string
    lastName: string
    password: string
    role: UserRole
  }): Promise<User>
  removeById(userId: string): Promise<void>
  export(): Promise<Blob>
}
