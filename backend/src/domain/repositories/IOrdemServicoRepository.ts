import type { TramitacaoAutor } from "./IOrdemServicoTramitacaoRepository.js";
import type {
  OrdemServicoStatusValue,
  OrdemServicoUrgenciaValue,
  PersistedOrdemServico,
} from "../entities/OrdemServico.js";

export type OrdemServicoContrato = {
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

export type OrdemServicoEmpenhoInfo = {
  id: string;
  numero: string;
  description: string;
  contrato: OrdemServicoContrato;
};

// Empenho vinculado à OS, com o valor destinado a ela
export type OrdemServicoVinculo = {
  empenho_id: string;
  numero: string;
  description: string;
  // Quanto deste empenho vai para a OS
  valor: number;
  // Valor total do empenho
  empenhoValue: number;
};

// Campos do documento da OS já validados — totalComBdi em centavos
export type OrdemServicoDocumentFields = {
  lote_id: string | null;
  setorRequisitante: string | null;
  urgencia: OrdemServicoUrgenciaValue | null;
  dataVistoria: Date | null;
  descricaoProblema: string | null;
  dataEmissao: Date | null;
  prazoMobilizacaoDias: number;
  prazoDias: number | null;
  totalComBdi: number | null;
  fiscalSetorial: string | null;
  fiscalTecnico_id: string | null;
  fiscalAdministrativo_id: string | null;
  condicoesEspeciais: string[];
};

// Emissão (ou reemissão) para a empresa: grava o prazo de ciência, o evento no histórico e
// a notificação, na mesma transação da OS
export type OrdemServicoEmissao = {
  tipo: "EMITIDA" | "REEMITIDA";
  emitidaEm: Date;
  cienciaPrazoAte: Date;
  autor: TramitacaoAutor;
};

// Dados já validados para gravar a OS — valores em centavos
export type OrdemServicoPersistData = OrdemServicoDocumentFields & {
  emissao?: OrdemServicoEmissao | undefined;
  // Na criação, com `numeracao` o repository gera o número (sequência por lote e ano)
  numero: string;
  numeracao?: { loteNumero: number | null; ano: number } | undefined;
  tenant_id: string;
  empenhos: { empenho_id: string; valor: number }[];
  dataInicio: Date;
  dataPrevisaoTermino: Date;
  obra_id: string | null;
};

export type OrdemServicoLoteInfo = {
  id: string;
  numero: number;
  nome: string;
  desconto: number;
};

export type OrdemServicoFiscalInfo = {
  id: string;
  tipo: "TECNICO" | "ADMINISTRATIVO";
  nome: string;
  ramal: string;
  email: string;
};

// Contrato do empenho: de onde saem os lotes e os fiscais que a OS pode escolher
export type OrdemServicoContratoDados = {
  id: string;
  tenant_id: string;
  lotes: { id: string; numero: number }[];
  fiscais: { id: string; tipo: "TECNICO" | "ADMINISTRATIVO" }[];
};

// Tudo o que o PDF da OS precisa, já com os valores em reais
export type OrdemServicoDocumentData = {
  ordemServico: PersistedOrdemServico;
  empenhoDescricao: string;
  contrato: {
    identificador: string;
    ePag: string;
    etp: string;
    termoReferencia: string;
    dataBaseSinapi: string;
    endereco: string;
    bdi: number;
    company_id: string;
    company: { name: string; cnpj: string };
    lotes: { numero: number; nome: string; desconto: number }[];
  };
  obra: {
    nome: string;
    identificacaoPatrimonial: string;
    idPatrimonialCompleto: string | null;
    apelido: string | null;
    areaConstruida: number | null;
    estadoConservacao: string | null;
  } | null;
  lote: { numero: number; nome: string; desconto: number } | null;
  fiscalTecnico: { nome: string; ramal: string; email: string } | null;
  fiscalAdministrativo: { nome: string; ramal: string; email: string } | null;
  tenant: { city: string; apelido: string };
};

export type OrdemServicoObra = {
  id: string;
  nome: string;
  identificacaoPatrimonial: string;
  tipo: string;
  status: string;
  dataConclusao: Date | null;
  latitude: number | null;
  longitude: number | null;
  responsavelTecnico: string;
};

// Vínculo com a situação financeira: quanto já foi liquidado dele nesta OS e quanto do
// empenho já está destinado a OS não canceladas (para o saldo livre)
export type OrdemServicoVinculoFinanceiro = OrdemServicoVinculo & {
  liquidado: number;
  empenhoComprometido: number;
};

export type OrdemServicoListItem = PersistedOrdemServico & {
  // Empenho principal — por ele se chega ao contrato e à empresa
  empenho: OrdemServicoEmpenhoInfo;
  lote: OrdemServicoLoteInfo | null;
  fiscalTecnico: OrdemServicoFiscalInfo | null;
  fiscalAdministrativo: OrdemServicoFiscalInfo | null;
  empenhos: OrdemServicoVinculoFinanceiro[];
  obra: OrdemServicoObra | null;
  // Soma das notas fiscais não canceladas lançadas nesta OS
  valorExecutado: number;
  // Apontamentos da empresa ainda sem decisão da fiscalização
  contestacoesAbertas: number;
};

export type OrdemServicoStats = {
  total: number;
  ativas: number;
  finalizadas: number;
  canceladas: number;
  valorTotal: number;
};

export type ListOrdensServicoResponse = {
  ordensServico: OrdemServicoListItem[];
  stats: OrdemServicoStats;
};

export type OrdemServicoOption = {
  id: string;
  numero: string;
  valor: number;
  dataInicio: Date | null;
  dataPrevisaoTermino: Date | null;
  empenho: OrdemServicoEmpenhoInfo;
  empenhos: OrdemServicoVinculo[];
};

export type OrdemServicoActiveCountByTenant = {
  tenant_id: string;
  count: number;
};

export interface IOrdemServicoRepository {
  /** Cria a OS com seus vínculos; valor da OS = soma dos vínculos. */
  create(data: OrdemServicoPersistData): Promise<OrdemServicoListItem>;
  verifyNumero(numero: string, tenant_id: string): Promise<boolean>;
  /**
   * Próximo número que a criação geraria para o lote (null = contrato sem lote) e o ano, sem
   * reservá-lo: se outra OS for criada antes, o número real pode ser o seguinte.
   */
  getProximoNumero(data: { tenant_id: string; lote_id: string | null; ano: number }): Promise<string>;
  /** Contrato do empenho, com os ids dos lotes e dos fiscais disponíveis para a OS. */
  findContratoByEmpenho(empenho_id: string): Promise<OrdemServicoContratoDados | null>;
  /** Dados do documento da OS; null se não existir. */
  getDocumentData(id: string): Promise<OrdemServicoDocumentData | null>;
  list(tenant_id?: string, company_id?: string): Promise<ListOrdensServicoResponse>;
  /** Contagem de OS ativas, agrupada por tenant — resumo multi-institucional do PLATFORM_ADMIN. */
  countActiveByTenant(): Promise<OrdemServicoActiveCountByTenant[]>;
  listOptionsForObra(tenant_id: string): Promise<OrdemServicoOption[]>;
  findById(id: string): Promise<PersistedOrdemServico | null>;
  /**
   * Atualiza número, cronograma e obra e substitui o conjunto de vínculos (valor da OS
   * é recalculado). Se a OS mudar de obra, as notas fiscais dela acompanham.
   */
  update(id: string, data: Omit<OrdemServicoPersistData, "tenant_id">): Promise<OrdemServicoListItem>;
  /** Empenhos vinculados à OS (valores em reais). */
  listVinculos(id: string): Promise<OrdemServicoVinculo[]>;
  /** Se já existe nota fiscal (qualquer status) desta OS lançada no empenho. */
  hasInvoicesForEmpenho(id: string, empenho_id: string): Promise<boolean>;
  /** Se já existe nota fiscal (qualquer status) lançada nesta OS. */
  hasInvoices(id: string): Promise<boolean>;
  updateStatus(id: string, status: OrdemServicoStatusValue): Promise<PersistedOrdemServico>;
  delete(id: string): Promise<void>;
  hasObraVinculada(id: string): Promise<boolean>;
}
