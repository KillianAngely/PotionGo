import { User, UserRole } from "../../types/User"

export interface IUserRepository {
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
}
