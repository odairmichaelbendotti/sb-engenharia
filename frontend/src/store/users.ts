import { create } from "zustand";
import type { User } from "../../types/user";
import { defaultFetch } from "../services/api";

const PAGE_SIZE = 10;

type UsersStore = {
  users: User[];
  page: number;
  hasNextPage: boolean;
  listUsers: (page: number) => Promise<void>;
  updateUserRole: (userId: string, role: User["role"]) => Promise<void>;
};

export const useUsers = create<UsersStore>((set) => ({
  users: [],
  page: 1,
  hasNextPage: false,

  listUsers: async (page: number) => {
    const response = await defaultFetch(`/list/users?page=${page}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch users");
    }

    const data = (await response.json()) as User[];
    set({ users: data, page, hasNextPage: data.length === PAGE_SIZE });
  },

  updateUserRole: async (userId: string, role: User["role"]) => {
    const response = await defaultFetch(`/user/${userId}/role`, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update role");
    }

    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId ? { ...user, role } : user,
      ),
    }));
  },
}));
