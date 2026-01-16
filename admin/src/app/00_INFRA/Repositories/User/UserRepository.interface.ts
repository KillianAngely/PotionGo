import { User, UserRole } from "../../types/User"

export interface IUserRepository {
  findAll(): Promise<User[] | null>
  findAllByRole(role: UserRole): Promise<User[] | null>
  findById(userId: string): Promise<User | null>
  removeById(userId: string): Promise<void>
}
