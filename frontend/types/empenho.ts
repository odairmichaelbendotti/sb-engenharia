export interface Empenho {
  id: number;
  numero: string;
  description: string;
  value: number;
  startAt: string;
  totalPaid: number;
  endAt: string;
  status?: "ativo" | "concluido" | "cancelado";
}

export type EmpenhoCategory =
  | "MANUTENCAO_PREDIAL"
  | "ALIMENTACAO"
  | "HOSPITALAR"
  | "COMBUSTIVEL"
  | "TECNOLOGIA"
  | "LIMPEZA_CONSERVACAO"
  | "SEGURANCA_VIGILANCIA"
  | "OUTROS";

export type EmpenhoList = {
  id: string;
  numero: string;
  description: string;
  category: EmpenhoCategory;
  startAt: Date;
  endAt: Date;
  value: number;
  totalPaid: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  contrato_id: string;
  contrato: EmpenhoContrato;
  /** Soma do valor das ordens de serviço não canceladas vinculadas a este empenho. */
  valorComprometido: number;
  /** value - valorComprometido. */
  saldoDisponivel: number;
};

type Company = {
  id: string;
  name: string;
  cnpj: string;
};

type EmpenhoContrato = {
  id: string;
  identificador: string;
  descricaoCurta: string;
  company: Company;
};
