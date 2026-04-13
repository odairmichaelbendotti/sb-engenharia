import { create } from "zustand";
import type { User } from "../../types/user";
import { defaultFetch } from "../services/api";
import { toast } from "sonner";

type UserStore = {
  user: User | null;
  fetchUser: () => void;
  signin: (email: string, password: string) => Promise<User>;
  logout: () => Promise<boolean>;
};

// const mockUser: User = {
//   id: "1",
//   name: "Odair Michael",
//   email: "obendotti@gmail.com",
//   role: "MASTER",
// };

export const useUser = create<UserStore>((set) => ({
  user: null,

  signin: async (email: string, password: string) => {
    try {
      const response = await defaultFetch("/signin", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        toast.error("Erro ao fazer login");
        throw new Error("Failed to sign in");
      }

      const data: User = await response.json();
      set({ user: data });
      return data;
    } catch (error) {
      console.error("Failed to sign in:", error);
      throw new Error("Failed to sign in" + error);
    }
  },
  logout: async () => {
    try {
      const response = await defaultFetch("/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to logout");
      }

      set({ user: null });
      toast.info("Logout realizado com sucesso");
      return true;
    } catch (error) {
      console.error("Failed to logout:", error);
      throw new Error("Failed to logout" + error);
    }
  },
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
      console.error("Failed to fetch user:", error);
      throw new Error("Failed to fetch user" + error);
    }
  },
}));
