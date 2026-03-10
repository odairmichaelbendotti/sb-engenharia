import { User } from "../entities/User.js";

export interface IUserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  //   findById(id: string): Promise<User | null>;
  //   delete(id: string): Promise<void>;
  //   update(user: User): Promise<void>;
  //   list(): Promise<User[]>;
}
