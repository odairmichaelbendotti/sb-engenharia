import { create } from "zustand";
import { defaultFetch } from "../services/api";
import type { Tenant } from "../../types/tenant";

type TenantsStore = {
  tenants: Tenant[];
  listTenants: () => Promise<void>;
};

export const useTenants = create<TenantsStore>((set) => ({
  tenants: [],

  listTenants: async () => {
    const response = await defaultFetch("/tenant/get-all");

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch tenants");
    }

    const data = (await response.json()) as Tenant[];
    set({ tenants: data });
  },
}));
