export class UserRepository implements IUserRepository {
  constructor(firestore: FirebaseFirestore.Firestore) {}

  async findById(userId: string): Promise<User | null> {}

  async findAllByRole(role: string): Promise<User[] | null> {}

  async removeById(userId: string): Promise<void> {}
}
