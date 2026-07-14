import { User } from "../entities/User.js";
import type { UserRole } from "../../generated/prisma/enums.js";

export type ListUserType = {
  tenant_id?: string | undefined;
  page: number;
};

export interface IUserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findUnapproved(): Promise<User[]>;
  approve(userId: string): Promise<User>;
  disapprove(userId: string): Promise<void>;
  list({ tenant_id, page }: ListUserType): Promise<User[]>;
  updateRole(userId: string, role: UserRole): Promise<User>;
}
