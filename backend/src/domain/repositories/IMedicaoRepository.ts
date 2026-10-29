import type { OrdemServicoStatusValue } from "../entities/OrdemServico.js";
import type { LinhaMedicaoInput, OrcamentoItemInput, PrecoBase, RegraDesconto } from "../medicao/medicao-calc.js";
import type { ItemPlanilhaCompleto, PlanilhaMedicao } from "../medicao/planilha-medicao.js";
import type { OrdemServicoEmissao } from "./IOrdemServicoRepository.js";

// Quantidades em milésimos e valores em centavos em todo este repositório: as contas de saldo
// precisam ser exatas. A conversão para a API (reais e decimais) fica nos use cases

export type MedicaoStatusValue = "RASCUNHO" | "FECHADA";

// OS com o que é preciso para checar acesso e regras
export type MedicaoOsContext = {
  id: string;
  numero: string;
  tenant_id: string;
  status: OrdemServicoStatusValue;
  // Empresa do contrato do empenho principal
  company_id: string;
  totalComBdi: number | null;
  // Soma dos empenhos
  valor: number;
  // Desconto copiado do lote na criação da OS (porcentagem) e como os preços foram informados
  desconto: number;
  precoBase: PrecoBase;
  // Como o desconto é aplicado em cada preço no modo COM_BDI
  regraDesconto: RegraDesconto;
  // Contrato com lotes e OS sem lote (OS antiga): o desconto da OS ficou 0
  semLote: boolean;
  // Emissão para a empresa (ver domain/tramitacao/ciencia.ts)
  aguardandoEmissao: boolean;
  emitidaEm: Date | null;
  cienciaPrazoAte: Date | null;
  cienciaDispensada: boolean;
  // Empenhos que financiam a OS, o principal primeiro
  empenhos: { empenho_id: string; numero: string; valor: number }[];
  dataInicio: Date | null;
  dataPrevisaoTermino: Date | null;
  // Identificação para as telas: obra, descrição do empenho principal, contrato e empresa
  descricaoEmpenho: string;
  obra: { id: string; nome: string } | null;
  contrato: { id: string; identificador: string; cor: string };
  empresa: { id: string; name: string };
};

export type MedicaoResumo = {
  id: string;
  ordemServico_id: string;
  numero: number;
  status: MedicaoStatusValue;
  periodoInicio: Date;
  periodoFim: Date;
  observacao: string | null;
  createdAt: Date;
  criadoPorNome: string;
  fechadaEm: Date | null;
  fechadaPorNome: string | null;
  reabertaEm: Date | null;
  reabertaPorNome: string | null;
  itens: LinhaMedicaoInput[];
};

export type PlanilhaOs = {
  itens: ItemPlanilhaCompleto[];
  // Em ordem de número
  medicoes: MedicaoResumo[];
};

// Nota fiscal não cancelada que paga a medição
export type NotaFiscalDaMedicao = { id: string; numero: string };

export type MedicaoAutor = { id: string; nome: string };

// OS da tela de medições, com o necessário para identificar a linha e filtrar por empresa → contrato → empenho
export type PainelOsRow = {
  id: string;
  numero: string;
  tenant_id: string;
  status: OrdemServicoStatusValue;
  dataInicio: Date | null;
  dataPrevisaoTermino: Date | null;
  valor: number;
  aguardandoEmissao: boolean;
  // Contrato com lotes e OS sem lote (OS antiga): o desconto da OS ficou 0
  semLote: boolean;
  // Descrição do empenho principal: título da linha quando a OS ainda não tem obra
  descricaoEmpenho: string;
  obra: { id: string; nome: string } | null;
  contrato: { id: string; identificador: string; cor: string };
  empresa: { id: string; name: string };
  empenhos: { id: string; numero: string }[];
};

export type MedicaoDadosInput = {
  periodoInicio: Date;
  periodoFim: Date;
  observacao: string | null;
  linhas: LinhaMedicaoInput[];
};

// A medição com a planilha e os dados da OS: alimenta a tela da medição e o PDF
export type MedicaoDocumentData = {
  medicao: MedicaoResumo;
  // Congelada na fechada; montada com o orçamento atual no rascunho
  planilha: PlanilhaMedicao;
  ordemServico: { id: string; numero: string; tenant_id: string; descricao: string | null };
  contrato: { identificador: string; ePag: string; company_id: string; company: { name: string; cnpj: string } };
  obra: {
    nome: string;
    identificacaoPatrimonial: string;
    idPatrimonialCompleto: string | null;
    apelido: string | null;
  } | null;
  lote: { numero: number; nome: string } | null;
  tenant: { city: string };
};

/**
 * Orçamento (planilha de itens) e medições da OS. Toda escrita trava a OS (SELECT ... FOR UPDATE)
 * e confere de novo as regras dentro da transação, então duas pessoas mexendo ao mesmo tempo não
 * passam do saldo nem abrem dois rascunhos.
 */
export interface IMedicaoRepository {
  findOsContext(ordemServico_id: string): Promise<MedicaoOsContext | null>;
  findOrdemServicoIdDaMedicao(medicao_id: string): Promise<string | null>;
  getPlanilha(ordemServico_id: string): Promise<PlanilhaOs>;
  /** Planilhas de várias OS de uma vez (OS sem item nem medição volta vazia). */
  getPlanilhas(ordemServico_ids: string[]): Promise<Map<string, PlanilhaOs>>;
  /** OS do tenant (todas, se undefined) para a tela de medições. */
  /** OS da tela de medições; sem tenant = todas (PLATFORM_ADMIN), com empresa = só as dos contratos dela. */
  listOsDoPainel(params: { tenant_id: string | undefined; company_id: string | undefined }): Promise<PainelOsRow[]>;
  hasMedicaoFechada(ordemServico_id: string): Promise<boolean>;
  /** Nota fiscal não cancelada de cada medição (as sem nota ficam fora do mapa). */
  findNotasFiscais(medicao_ids: string[]): Promise<Map<string, NotaFiscalDaMedicao>>;

  /**
   * Grava a planilha inteira (mantém os itens com id, cria os novos e exclui os que faltam) e, na
   * mesma transação, o modo de preço, o total com BDI e o valor de cada empenho (o valor da OS
   * passa a ser a soma dos itens). Com `emissao`, reemite a OS para a empresa.
   */
  saveOrcamento(params: {
    ordemServico_id: string;
    precoBase: PrecoBase;
    regraDesconto: RegraDesconto;
    itens: OrcamentoItemInput[];
    totalComBdi: number;
    empenhos: { empenho_id: string; valor: number }[];
    emissao: OrdemServicoEmissao | null;
  }): Promise<void>;

  /** Cria o rascunho com o próximo número; recusa se já houver um. */
  createMedicao(params: { ordemServico_id: string; dados: MedicaoDadosInput; autor: MedicaoAutor }): Promise<string>;
  updateMedicao(params: { medicao_id: string; dados: MedicaoDadosInput }): Promise<void>;
  deleteMedicao(medicao_id: string): Promise<void>;
  /** Fecha o rascunho, congelando a planilha com os fiscais da OS. */
  fecharMedicao(params: { medicao_id: string; autor: MedicaoAutor; now: Date }): Promise<void>;
  /** Volta a última medição fechada para rascunho. */
  reabrirMedicao(params: { medicao_id: string; autor: MedicaoAutor; now: Date }): Promise<void>;

  getDocumentData(medicao_id: string): Promise<MedicaoDocumentData | null>;
}
