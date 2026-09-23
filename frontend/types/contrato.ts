export type ContratoStatus = "ATIVO" | "FINALIZADO" | "CANCELADO";

type ContratoCompany = {
  id: string;
  name: string;
  cnpj: string;
};

export type ContratoEmpenhoResumo = {
  id: string;
  numero: string;
  description: string;
  value: number;
  status: string;
  obras: { id: string }[];
};

export type Contrato = {
  id: string;
  identificador: string;
  descricaoCurta: string;
  valor: number;
  dataInicio: Date;
  dataFim: Date;
  status: ContratoStatus;
  cor: string;
  company_id: string;
  company: ContratoCompany;
  empenhos: ContratoEmpenhoResumo[];
  valorEmpenhado: number;
  saldoDisponivel: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ContratoStats = {
  total: number;
  ativos: number;
  finalizados: number;
  cancelados: number;
  valorTotal: number;
};

export type ListContratos = {
  contratos: Contrato[];
  stats: ContratoStats;
};

export type CreateContratoPayload = {
  identificador: string;
  descricaoCurta: string;
  valor: string;
  dataInicio: string;
  dataFim: string;
  company_id: string;
};

export type ContratoOptionEmpenho = {
  id: string;
  numero: string;
  description: string;
};

export type ContratoOption = {
  id: string;
  identificador: string;
  descricaoCurta: string;
  cor: string;
  empenhos: ContratoOptionEmpenho[];
};
