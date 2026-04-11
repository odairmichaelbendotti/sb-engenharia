import type { Empenho } from "./empenho";

export interface Empresa {
  id: number;
  name: string;
  cnpj: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  empenhos: Empenho[];
}
