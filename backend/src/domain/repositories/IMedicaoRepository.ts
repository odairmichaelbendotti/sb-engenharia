import type { OrdemServicoStatusValue } from "../entities/OrdemServico.js";
import type { LinhaMedicaoInput, OrcamentoItemInput } from "../medicao/medicao-calc.js";
import type { ItemPlanilhaCompleto, PlanilhaMedicao } from "../medicao/planilha-medicao.js";

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
  valor: number;
  descontoLote: number;
  dataInicio: Date | null;
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

export type MedicaoAutor = { id: string; nome: string };

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
  hasMedicaoFechada(ordemServico_id: string): Promise<boolean>;

  /** Grava a planilha inteira: mantém os itens com id, cria os novos e exclui os que faltam. */
  saveOrcamento(params: { ordemServico_id: string; itens: OrcamentoItemInput[] }): Promise<void>;

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
