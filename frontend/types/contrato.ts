export type ContratoStatus = "ATIVO" | "FINALIZADO" | "CANCELADO";

type ContratoCompany = {
  id: string;
  name: string;
  cnpj: string;
};

export type FiscalTipo = "TECNICO" | "ADMINISTRATIVO";

// Lote da licitação (opcional por contrato); desconto em porcentagem
export type ContratoLote = {
  id: string;
  numero: number;
  nome: string;
  desconto: number;
};

// Fiscal do contrato; cada OS escolhe entre eles o técnico e o administrativo
export type ContratoFiscal = {
  id: string;
  tipo: FiscalTipo;
  nome: string;
  ramal: string;
  email: string;
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
  // Dados que saem na Ordem de Serviço; "A PREENCHER" nos contratos anteriores a eles
  ePag: string;
  etp: string;
  termoReferencia: string;
  dataBaseSinapi: string;
  endereco: string;
  // BDI em porcentagem (ex.: 21.19)
  bdi: number;
  lotes: ContratoLote[];
  fiscais: ContratoFiscal[];
  empenhos: ContratoEmpenhoResumo[];
  valorEmpenhado: number;
  // Saldo a empenhar (valor − empenhos não cancelados)
  saldoDisponivel: number;
  // Soma das notas fiscais não canceladas
  valorLiquidado: number;
  // Quanto do contrato ainda falta pagar (valor − liquidado)
  saldoALiquidar: number;
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
  ePag: string;
  etp: string;
  termoReferencia: string;
  dataBaseSinapi: string;
  endereco: string;
  bdi: number;
  // Com `id` atualiza o item existente; sem, cria. O que não vier é removido
  lotes: { id?: string; numero: number; nome: string; desconto: number }[];
  fiscais: { id?: string; tipo: FiscalTipo; nome: string; ramal: string; email: string }[];
};

// Contratos cadastrados antes dos dados da OS ficam com este texto até serem editados
export const PLACEHOLDER_A_PREENCHER = "A PREENCHER";

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
