export type ObraStatus = "EM_ANDAMENTO" | "CONCLUIDA" | "PARALISADA" | "CANCELADA";
export type ObraTipo = "CONSTRUCAO" | "REFORMA" | "AMPLIACAO" | "PAVIMENTACAO" | "SANEAMENTO" | "MANUTENCAO_PREDIAL" | "OUTRO";

export type ObraContrato = {
  id: string;
  identificador: string;
  descricaoCurta: string;
  cor: string;
  company: {
    id: string;
    name: string;
    cnpj: string;
  };
};

// OS executada na obra, com o cronograma e quanto dela já foi executado (notas fiscais)
export type ObraOrdemServico = {
  id: string;
  numero: string;
  valor: number;
  status: string;
  dataInicio: string | null;
  dataPrevisaoTermino: string | null;
  valorExecutado: number;
  empenhos: { empenho_id: string; numero: string }[];
  contrato: ObraContrato;
};

export type ObraInvoiceResumo = {
  id: string;
  numero: string;
  description: string;
  vencimento: string;
  value: number;
  status: string;
  ordemServico_id: string | null;
};

export type Obra = {
  id: string;
  nome: string;
  identificacaoPatrimonial: string;
  tipo: ObraTipo;
  status: ObraStatus;
  descricao: string;
  latitude?: number;
  longitude?: number;
  valorExecutado: number;
  // Prazo da obra calculado a partir das OS: menor início e maior previsão de término
  dataInicio: string | null;
  dataPrevisaoTermino: string | null;
  dataConclusao?: string;
  // Orçamento: soma das OS não canceladas
  valor: number;
  // Contrato da OS mais antiga — define a cor da obra no mapa
  contrato: ObraContrato | null;
  ordensServico: ObraOrdemServico[];
  responsavelTecnico: string;
  anotacoes?: string;
  invoices: ObraInvoiceResumo[];
  createdAt: Date;
  updatedAt: Date;
};

export type ObraStats = {
  total: number;
  emAndamento: number;
  concluidas: number;
  paralisadas: number;
  canceladas: number;
  orcamentoTotal: number;
  valorExecutadoTotal: number;
};

export type ListObras = {
  obras: Obra[];
  stats: ObraStats;
};

// Uma opção por OS: a nota fiscal indica a obra e a OS dela que está sendo paga
export type ObraOptionForInvoice = {
  id: string;
  nome: string;
  identificacaoPatrimonial: string;
  ordemServico: { id: string; numero: string };
};

// Opção do campo "Obra" no cadastro de OS
export type ObraOption = {
  id: string;
  nome: string;
  identificacaoPatrimonial: string;
  status: ObraStatus;
};

export type CreateObraPayload = {
  nome: string;
  identificacaoPatrimonial: string;
  tipo: ObraTipo;
  descricao: string;
  latitude?: string;
  longitude?: string;
  responsavelTecnico: string;
  anotacoes?: string;
  // OS executadas na obra (ao menos uma); o cronograma vem delas
  ordemServico_ids: string[];
};

// Detalhe do painel do Mapa de Obras (GET /obra/detail/:id) — valores em reais,
// liquidado calculado a partir das notas fiscais não canceladas
export type ObraDetailEmpenhoResumo = {
  id: string;
  numero: string;
  description: string;
  status: string;
  startAt: string;
  endAt: string;
  value: number;
  liquidado: number;
  ordensServicoCount: number;
};

// Situação de cada empenho que financia as OS desta obra
export type ObraDetailEmpenhoFinanceiro = {
  id: string;
  value: number;
  // Quanto do empenho foi destinado às OS desta obra
  valorNaOS: number;
  // Liquidado do empenho inteiro (todas as OS)
  liquidado: number;
  // Liquidado só nesta obra
  liquidadoNaOS: number;
  // Soma do destinado a OS não canceladas (inclui as desta obra)
  comprometidoOS: number;
  ordensServicoCount: number;
};

export type ObraDetailFinancial = {
  // Totais da obra: soma das OS não canceladas e das notas da obra
  obra: { valor: number; liquidado: number };
  empenhos: ObraDetailEmpenhoFinanceiro[];
  contrato: {
    valor: number;
    totalEmpenhado: number;
    totalLiquidado: number;
    empenhos: ObraDetailEmpenhoResumo[];
  };
  invoices: ObraInvoiceResumo[];
};

export type ObraDetail = {
  obra: Omit<Obra, "valorExecutado" | "valor" | "contrato" | "ordensServico" | "invoices">;
  ordensServico: ObraOrdemServico[];
  // Empenhos que financiam as OS da obra
  empenhos: { id: string; numero: string; description: string; status: string; startAt: string; endAt: string }[];
  // Contrato da OS mais antiga da obra
  contrato: ObraContrato & {
    status: string;
    dataInicio: string;
    dataFim: string;
  };
  // null para quem não vê o domínio administrativo (ex.: login de empresa)
  financial: ObraDetailFinancial | null;
};
