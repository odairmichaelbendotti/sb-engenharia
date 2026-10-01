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
  dataConclusao: string | null;
  latitude: number | null;
  longitude: number | null;
  responsavelTecnico: string;
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
  // Cronograma de execução da OS (data sem horário, meia-noite UTC); null em OS antigas sem prazo
  dataInicio: string | null;
  dataPrevisaoTermino: string | null;
  obra_id: string | null;
  obra: OrdemServicoObra | null;
  // Soma das notas fiscais não canceladas lançadas nesta OS
  valorExecutado: number;
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
  dataInicio: string;
  dataPrevisaoTermino: string;
  // Obra em que a OS é executada; null = ainda sem obra
  obra_id: string | null;
};

export type OrdemServicoOption = {
  id: string;
  numero: string;
  valor: number;
  dataInicio: string | null;
  dataPrevisaoTermino: string | null;
  empenho: OrdemServicoEmpenho;
  empenhos: OrdemServicoVinculo[];
};
