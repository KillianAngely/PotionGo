import { User, UserRole } from "../../types/User"
import {
  IUserRepository,
  UserListQuery,
  UserListResponse,
} from "./UserRepository.interface"
import { assertApiResponse } from "../_utils/http"

export class UserRepository implements IUserRepository {
  private baseUrl: string

  constructor() {
    this.baseUrl = "/api/users"
  }

  async list(query: UserListQuery = {}): Promise<UserListResponse> {
    const params = new URLSearchParams()
    if (query.page) params.set("page", String(query.page))
    if (query.pageSize) params.set("pageSize", String(query.pageSize))
    if (query.role && query.role !== "all") params.set("role", query.role)
    if (query.search) params.set("search", query.search)
    if (query.sort && query.sort.length > 0) params.set("sort", query.sort.join(","))

    const url = params.size > 0 ? `${this.baseUrl}?${params.toString()}` : this.baseUrl
    const response = await fetch(url, { credentials: "include" })
    await assertApiResponse(response, "Erreur lors de la récupération des utilisateurs")
    const data = await response.json()
    return {
      users: data.users ?? [],
      pagination: data.pagination ?? { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    }
  }

  async findAll(): Promise<User[] | null> {
    try {
      const data = await this.list({ page: 1, pageSize: 500 })
      return data.users || null
    } catch (error) {
      console.error(`Error finding all users:`, error)
      return null
    }
  }

  async findById(userId: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, { credentials: "include" })
      if (response.status === 404) {
        return null
      }
      await assertApiResponse(response, "Erreur lors de la récupération de l'utilisateur")
      const data = await response.json()
      return data.user || null
    } catch (error) {
      console.error(`Error finding user by id ${userId}:`, error)
      return null
    }
  }

  async findAllByRole(role: UserRole): Promise<User[] | null> {
    try {
      const data = await this.list({ role, page: 1, pageSize: 500 })
      return data.users || null
    } catch (error) {
      console.error(`Error finding users by role ${role}:`, error)
      return null
    }
  }

  async create(payload: {
    email: string
    firstName: string
    lastName: string
    password: string
    role: UserRole
  }): Promise<User> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      await assertApiResponse(response, "Erreur lors de la création de l'utilisateur")

      const data = await response.json()
      return data.user as User
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    }
  }

  async removeById(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: "DELETE",
        credentials: "include",
      })
      await assertApiResponse(response, "Erreur lors de la suppression de l'utilisateur")
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error)
      throw error
    }
  }
}
