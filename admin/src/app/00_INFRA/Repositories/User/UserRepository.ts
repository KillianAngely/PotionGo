import { User, UserRole } from "../../types/User"
import { IUserRepository } from "./UserRepository.interface"

export class UserRepository implements IUserRepository {
  private baseUrl: string

  constructor() {
    this.baseUrl = "/api/users"
  }

  async findAll(): Promise<User[] | null> {
    try {
      const response = await fetch(this.baseUrl, { credentials: "include" })
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des utilisateurs")
      }
      const data = await response.json()
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
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération de l'utilisateur")
      }
      const data = await response.json()
      return data.user || null
    } catch (error) {
      console.error(`Error finding user by id ${userId}:`, error)
      return null
    }
  }

  async findAllByRole(role: UserRole): Promise<User[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}?role=${role}`, { credentials: "include" })
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des utilisateurs par rôle")
      }
      const data = await response.json()
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

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message = data?.error || "Erreur lors de la création de l'utilisateur"
        throw new Error(message)
      }

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
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'utilisateur")
      }
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error)
      throw error
    }
  }
}
