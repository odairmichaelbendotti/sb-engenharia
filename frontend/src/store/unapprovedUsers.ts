import { create } from "zustand";
import type { User } from "../../types/user";
import { defaultFetch } from "../services/api";

type UnapprovedUsersStore = {
  users: User[];
  hasLoaded: boolean;
  listUnapprovedUsers: () => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  isFetching: boolean;
};

export const useUnapprovedUsers = create<UnapprovedUsersStore>((set) => ({
  users: [],
  hasLoaded: false,
  isFetching: false,
  listUnapprovedUsers: async () => {
    const response = await defaultFetch("/list-unapproved-users", {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch unapproved users");
    }

    const data = (await response.json()) as User[];
    set({ users: data, hasLoaded: true });
  },
  approveUser: async (userId: string) => {
    try {
      set({ isFetching: true });
      const response = await defaultFetch(`/user/${userId}/approve`, {
        method: "PUT",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to approve this user");
      }

      set((state) => ({
        users: state.users.filter((user) => user.id !== userId),
      }));
    } catch (err) {
      console.log(err);
      set({ isFetching: false });
    } finally {
      set({ isFetching: false });
    }
  },
}));
