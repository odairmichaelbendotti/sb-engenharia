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

// Vínculo com a situação financeira (vem só na listagem de OS)
export type OrdemServicoVinculoFinanceiro = OrdemServicoVinculo & {
  // Notas não canceladas desta OS lançadas neste empenho
  liquidado: number;
  // Quanto do empenho já está destinado a OS não canceladas (inclui esta)
  empenhoComprometido: number;
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

export type OrdemServicoUrgencia = "EMERGENCIA" | "URGENCIA" | "PROGRAMADA" | "PREVENTIVA";

export type OrdemServicoLote = {
  id: string;
  numero: number;
  nome: string;
  // Porcentagem
  desconto: number;
};

export type OrdemServicoFiscal = {
  id: string;
  tipo: "TECNICO" | "ADMINISTRATIVO";
  nome: string;
  ramal: string;
  email: string;
};

export type OrdemServico = {
  id: string;
  numero: string;
  valor: number;
  status: OrdemServicoStatus;
  // Empenho principal (o primeiro vinculado) — por ele se chega ao contrato
  empenho_id: string;
  empenho: OrdemServicoEmpenho;
  empenhos: OrdemServicoVinculoFinanceiro[];
  // Cronograma de execução da OS (data sem horário, meia-noite UTC); null em OS antigas sem prazo
  dataInicio: string | null;
  dataPrevisaoTermino: string | null;
  obra_id: string | null;
  obra: OrdemServicoObra | null;
  // Soma das notas fiscais não canceladas lançadas nesta OS
  valorExecutado: number;
  // Dados do documento da OS; nulos nas OS anteriores a eles
  // Sequência do número gerado pelo sistema; nula nas OS com número antigo (esse ainda pode ser corrigido)
  sequencia: number | null;
  lote_id: string | null;
  lote: OrdemServicoLote | null;
  setorRequisitante: string | null;
  urgencia: OrdemServicoUrgencia | null;
  // Datas sem horário (meia-noite UTC)
  dataVistoria: string | null;
  descricaoProblema: string | null;
  dataEmissao: string | null;
  // Dias de mobilização, já incluídos no prazo total
  prazoMobilizacaoDias: number;
  prazoDias: number | null;
  // Total com BDI em reais: das OS antigas, informado; das com orçamento, a soma dos itens com BDI
  totalComBdi: number | null;
  // Como os preços do orçamento foram informados e o desconto copiado do lote (porcentagem)
  precoBase: "COM_BDI" | "COM_BDI_E_DESCONTO";
  desconto: number;
  // Orçamento da OS (valor da OS = orçamento) ou do contrato inteiro (valor da OS = empenhado)
  escopoOrcamento: "ORDEM_SERVICO" | "CONTRATO";
  // Criada e ainda não emitida: o valor sai do orçamento e a empresa só vê depois da emissão
  aguardandoEmissao: boolean;
  fiscalSetorial: string | null;
  fiscalTecnico_id: string | null;
  fiscalTecnico: OrdemServicoFiscal | null;
  fiscalAdministrativo_id: string | null;
  fiscalAdministrativo: OrdemServicoFiscal | null;
  condicoesEspeciais: string[];
  // Anexos escolhidos; null = OS anterior à escolha, que leva os seis anexos padrão
  anexos: AnexoOs[] | null;
  comentariosTecnicos: string[];
  // Ciência da empresa (horário do servidor); nulos e dispensada nas OS anteriores à regra
  emitidaEm: string | null;
  cienciaPrazoAte: string | null;
  cienciaDispensada: boolean;
  visualizadaEm: string | null;
  cienteEm: string | null;
  cienteNome: string | null;
  // Apontamentos da empresa ainda sem decisão da fiscalização
  contestacoesAbertas: number;
  // Orçamento lançado em itens (as OS antigas, de valor informado à mão, não têm)
  temOrcamento: boolean;
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
  // Na criação o número é gerado pelo sistema; na edição de OS antiga ainda pode ser corrigido
  numero?: string;
  // Valor da OS = soma do que cada empenho destina a ela (em reais)
  empenhos: { empenho_id: string; valor: number }[];
  dataInicio: string;
  // O backend calcula o término a partir do início e do prazo em dias
  dataPrevisaoTermino: string;
  // Obra em que a OS é executada; null = ainda sem obra
  obra_id: string | null;
  lote_id: string | null;
  setorRequisitante: string;
  urgencia: OrdemServicoUrgencia | null;
  dataVistoria: string | null;
  descricaoProblema: string;
  dataEmissao: string;
  prazoMobilizacaoDias: number;
  prazoDias: number | null;
  totalComBdi: number | null;
  fiscalSetorial: string;
  fiscalTecnico_id: string | null;
  fiscalAdministrativo_id: string | null;
  condicoesEspeciais: string[];
  anexos: AnexoOs[];
  comentariosTecnicos: string[];
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

// Anexos da OS (catálogo em pages/OrdemServico/anexos-os.ts, espelho do backend)
export type AnexoPadraoCodigo =
  | "PLANILHA_SINTETICA"
  | "PLANILHA_ANALITICA"
  | "CRONOGRAMA"
  | "PREMISSAS_TECNICAS"
  | "PRODUTIVIDADE_SINAPI"
  | "OBSERVACOES_TECNICAS";

// Anexo escolhido: um da lista padrão (codigo) ou outro, só com título (codigo null)
export type AnexoOs = { codigo: AnexoPadraoCodigo | null; titulo: string; observacao: string | null };
