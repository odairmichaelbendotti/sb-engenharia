import { create } from "zustand";
import { defaultFetch } from "../services/api";
import type { Tenant, TenantOption, TenantSummaryEntry } from "../../types/tenant";
import type { CreateTenantType } from "../../types/create-tenant";

type findCepType = {
  bairro: string;
  cep: string;
  complemento: string;
  ddd: string;
  estado: string;
  gia: string;
  ibge: string;
  localidade: string;
  logradouro: string;
  regiao: string;
  siafi: string;
  uf: string;
  unidade: string;
};

type MyTenant = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
};

type TenantsStore = {
  tenants: Tenant[];
  tenantOptions: TenantOption[];
  myTenant: MyTenant | null;
  tenantsSummary: TenantSummaryEntry[];
  listTenants: () => Promise<void>;
  listTenantOptions: () => Promise<void>;
  createTenant: (tenant: CreateTenantType) => Promise<Tenant>;
  findCep: (cep: string) => Promise<findCepType>;
  fetchMyTenant: () => Promise<void>;
  fetchTenantsSummary: () => Promise<void>;
};

export const useTenants = create<TenantsStore>((set) => ({
  tenants: [],
  tenantOptions: [],
  myTenant: null,
  tenantsSummary: [],

  listTenants: async () => {
    const response = await defaultFetch("/tenant/get-all", {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch tenants");
    }

    const data = (await response.json()) as Tenant[];
    set({ tenants: data });
  },

  listTenantOptions: async () => {
    const response = await defaultFetch("/tenant/list-public");

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch tenants");
    }

    const data = (await response.json()) as TenantOption[];
    set({ tenantOptions: data });
  },

  createTenant: async (tenant: CreateTenantType) => {
    const response = await defaultFetch("/tenant/create", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(tenant),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create tenant");
    }

    const data = (await response.json()) as Tenant;
    set((state) => ({ tenants: [...state.tenants, data] }));
    return data;
  },

  fetchMyTenant: async () => {
    const response = await defaultFetch("/tenant/me", {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch tenant location");
    }

    const data = (await response.json()) as MyTenant;
    set({ myTenant: data });
  },

  fetchTenantsSummary: async () => {
    const response = await defaultFetch("/tenant/summary", {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch tenants summary");
    }

    const data = (await response.json()) as TenantSummaryEntry[];
    set({ tenantsSummary: data });
  },

  findCep: async (cep: string): Promise<findCepType> => {
    if (!cep || cep.length < 8) throw new Error("CEP inválido");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

      if (!response.ok) throw new Error("CEP não encontrado");

      const data = await response.json();
      return data as findCepType;
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao buscar CEP");
    }
  },
}));
