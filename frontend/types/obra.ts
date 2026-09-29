export type ObraStatus = "EM_ANDAMENTO" | "CONCLUIDA" | "PARALISADA" | "CANCELADA";
export type ObraTipo = "CONSTRUCAO" | "REFORMA" | "AMPLIACAO" | "PAVIMENTACAO" | "SANEAMENTO" | "MANUTENCAO_PREDIAL" | "OUTRO";

export type ObraEmpenho = {
  id: string;
  numero: string;
  description: string;
  category: string;
  status: string;
  value: number;
  totalPaid: number;
  startAt: string;
  endAt: string;
  contrato: {
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
};

export type ObraOrdemServico = {
  id: string;
  numero: string;
  valor: number;
  status: string;
  empenho: ObraEmpenho;
};

export type ObraInvoiceResumo = {
  id: string;
  numero: string;
  description: string;
  vencimento: string;
  value: number;
  status: string;
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
  dataInicio: Date;
  dataPrevisaoTermino: Date;
  dataConclusao?: Date;
  responsavelTecnico: string;
  anotacoes?: string;
  ordemServico_id: string;
  ordemServico: ObraOrdemServico;
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

export type ObraOptionForInvoice = {
  id: string;
  nome: string;
  identificacaoPatrimonial: string;
};

export type CreateObraPayload = {
  nome: string;
  identificacaoPatrimonial: string;
  tipo: ObraTipo;
  descricao: string;
  latitude?: string;
  longitude?: string;
  dataInicio: string;
  dataPrevisaoTermino: string;
  responsavelTecnico: string;
  anotacoes?: string;
  /** Obrigatório na criação (validado em runtime); imutável em edições. */
  ordemServico_id?: string;
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

// Situação de cada empenho que financia a OS desta obra
export type ObraDetailEmpenhoFinanceiro = {
  id: string;
  value: number;
  // Quanto do empenho foi destinado a esta OS
  valorNaOS: number;
  // Liquidado do empenho inteiro (todas as OS)
  liquidado: number;
  // Liquidado só nesta obra
  liquidadoNaOS: number;
  // Soma do destinado a OS não canceladas (inclui esta OS)
  comprometidoOS: number;
  ordensServicoCount: number;
};

export type ObraDetailFinancial = {
  ordemServico: { valor: number; liquidado: number };
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
  obra: Omit<Obra, "valorExecutado" | "ordemServico" | "invoices" | "dataInicio" | "dataPrevisaoTermino" | "dataConclusao"> & {
    dataInicio: string;
    dataPrevisaoTermino: string;
    dataConclusao: string | null;
  };
  ordemServico: { id: string; numero: string; status: string };
  // Empenhos que financiam a OS; o primeiro é o principal
  empenhos: { id: string; numero: string; description: string; status: string; startAt: string; endAt: string }[];
  contrato: {
    id: string;
    identificador: string;
    descricaoCurta: string;
    cor: string;
    status: string;
    dataInicio: string;
    dataFim: string;
    company: { id: string; name: string; cnpj: string };
  };
  // null para quem não vê o domínio administrativo (ex.: login de empresa)
  financial: ObraDetailFinancial | null;
};
