export type ObraStatus = "EM_ANDAMENTO" | "CONCLUIDA" | "PARALISADA" | "CANCELADA";
export type ObraTipo = "CONSTRUCAO" | "REFORMA" | "AMPLIACAO" | "PAVIMENTACAO" | "SANEAMENTO" | "OUTRO";

export type Obra = {
  id: string;
  nome: string;
  codigo: string;
  tipo: ObraTipo;
  status: ObraStatus;
  descricao: string;
  logradouro: string;
  cidade: string;
  estado: string;
  orcamento: number;
  valorExecutado: number;
  dataInicio: Date;
  dataPrevisaoTermino: Date;
  dataConclusao?: Date;
  responsavelTecnico: string;
  anotacoes?: string;
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

export type CreateObraPayload = {
  nome: string;
  codigo: string;
  tipo: ObraTipo;
  descricao: string;
  logradouro: string;
  cidade: string;
  estado: string;
  orcamento: string;
  dataInicio: string;
  dataPrevisaoTermino: string;
  responsavelTecnico: string;
  anotacoes?: string;
};
