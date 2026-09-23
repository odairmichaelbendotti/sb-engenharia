import type { Empenho } from "./empenho";

export interface Empresa {
  id: string;
  name: string;
  cnpj: string;
  cep: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  empenhos: Empenho[];
}

export type CreateCompanyAccessPayload = {
  name: string;
  email: string;
};

export type CreateCompanyAccessResult = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    company_id: string | null;
  };
  password: string;
};
