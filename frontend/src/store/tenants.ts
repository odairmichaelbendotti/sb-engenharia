import { create } from "zustand";
import { defaultFetch } from "../services/api";
import type { Tenant } from "../../types/tenant";
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

type TenantsStore = {
  tenants: Tenant[];
  listTenants: () => Promise<void>;
  createTenant: (tenant: CreateTenantType) => Promise<Tenant>;
  findCep: (cep: string) => Promise<findCepType>;
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
