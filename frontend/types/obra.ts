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
