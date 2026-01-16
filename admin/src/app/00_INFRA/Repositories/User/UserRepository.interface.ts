// user need to be typed properly later


interface IUserRepository {
  findAllByRole(role: string): Promise<User[] | null>
  findById(userId: string): Promise<User | null>
  removeById(userId: string): Promise<void>
}
