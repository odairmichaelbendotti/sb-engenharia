import { create } from "zustand";
import type { User } from "../../types/user";
import { defaultFetch } from "../services/api";
import { toast } from "sonner";

type UserStore = {
  user: User | null;
  fetchUser: () => Promise<void>;
  signin: (email: string, password: string) => Promise<User>;
  logout: () => Promise<boolean>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    tenant_id: string;
  }) => Promise<User>;
};

export const useUser = create<UserStore>((set) => ({
  user: null,
  signup: async ({ name, email, password, tenant_id }) => {
    const response = await defaultFetch(`/signup`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        name,
        email,
        password,
        tenant_id,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to sign up");
    }

    const data: User = await response.json();
    set({ user: data });
    return data;
  },
  signin: async (email: string, password: string) => {
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
  },
  logout: async () => {
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
  },
  fetchUser: async () => {
    const response = await defaultFetch("/me", {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }

    const data: User = await response.json();
    set({ user: data });
  },
}));
