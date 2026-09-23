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

export type OrdemServicoObra = {
  id: string;
  nome: string;
  status: string;
};

export type OrdemServico = {
  id: string;
  numero: string;
  valor: number;
  status: OrdemServicoStatus;
  empenho_id: string;
  empenho: OrdemServicoEmpenho;
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
  valor: string;
  empenho_id: string;
};

export type OrdemServicoOption = {
  id: string;
  numero: string;
  valor: number;
  empenho: OrdemServicoEmpenho;
};
