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
  // Contratos da empresa na organização (a listagem traz; só o status é usado na tela)
  contratos?: { id: string; status: string }[];
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
