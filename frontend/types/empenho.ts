export interface Empenho {
  id: number;
  numero: string;
  valor: number;
  startAt: string;
  endAt: string;
  status?: "ativo" | "concluido" | "cancelado";
}

export type EmpenhoList = {
  id: string;
  numero: string;
  description: string;
  startAt: Date;
  endAt: Date;
  value: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  company_id: string;
  company: Company;
};

type Company = {
  id: string;
  name: string;
  cnpj: string;
};
