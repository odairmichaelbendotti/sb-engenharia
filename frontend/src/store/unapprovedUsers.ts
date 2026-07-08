import { create } from "zustand";
import type { User } from "../../types/user";
import { defaultFetch } from "../services/api";

type UnapprovedUsersStore = {
  users: User[];
  hasLoaded: boolean;
  listUnapprovedUsers: () => Promise<void>;
};

export const useUnapprovedUsers = create<UnapprovedUsersStore>((set) => ({
  users: [],
  hasLoaded: false,

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
}));
