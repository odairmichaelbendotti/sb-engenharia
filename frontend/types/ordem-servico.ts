export type OrdemServicoStatus = "ATIVO" | "FINALIZADO" | "CANCELADO";

type OrdemServicoContrato = {
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

export type OrdemServicoEmpenho = {
  id: string;
  numero: string;
  description: string;
  contrato: OrdemServicoContrato;
};

// Empenho que financia a OS e quanto dele vai para ela
export type OrdemServicoVinculo = {
  empenho_id: string;
  numero: string;
  description: string;
  valor: number;
  // Valor total do empenho
  empenhoValue: number;
};

export type OrdemServicoObra = {
  id: string;
  nome: string;
  identificacaoPatrimonial: string;
  tipo: string;
  status: string;
  dataInicio: string;
  dataPrevisaoTermino: string;
  dataConclusao: string | null;
  latitude: number | null;
  longitude: number | null;
  responsavelTecnico: string;
  valorExecutado: number;
};

export type OrdemServico = {
  id: string;
  numero: string;
  valor: number;
  status: OrdemServicoStatus;
  // Empenho principal (o primeiro vinculado) — por ele se chega ao contrato
  empenho_id: string;
  empenho: OrdemServicoEmpenho;
  empenhos: OrdemServicoVinculo[];
  obra: OrdemServicoObra | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrdemServicoStats = {
  total: number;
  ativas: number;
  finalizadas: number;
  canceladas: number;
  valorTotal: number;
};

export type ListOrdensServico = {
  ordensServico: OrdemServico[];
  stats: OrdemServicoStats;
};

export type CreateOrdemServicoPayload = {
  numero: string;
  // Valor da OS = soma do que cada empenho destina a ela (em reais)
  empenhos: { empenho_id: string; valor: number }[];
};

export type OrdemServicoOption = {
  id: string;
  numero: string;
  valor: number;
  empenho: OrdemServicoEmpenho;
  empenhos: OrdemServicoVinculo[];
};
