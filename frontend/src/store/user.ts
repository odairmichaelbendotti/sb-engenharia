import { create } from "zustand";
import type { User } from "../../types/user";
import { defaultFetch } from "../services/api";

type UserStore = {
  user: User | null;
  auth: User | null;
};

// const mockUser: User = {
//   id: "1",
//   name: "Odair Michael",
//   email: "obendotti@gmail.com",
//   role: "MASTER",
// };

export const useUser = create<UserStore>((set) => ({
  user: null,
  auth: null,

  fetchUser: async () => {
    try {
      const response = await defaultFetch("/me", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const data: User = await response.json();
      set({ user: data });
    } catch (error) {
      throw new Error("Failed to fetch user" + error);
    }
  },
}));
