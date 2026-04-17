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
