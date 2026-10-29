import type { AnexoOs } from "../documents/anexos-os.js";
import { DomainError } from "../errors/DomainError.js";

export type OrdemServicoStatusValue = "ATIVO" | "FINALIZADO" | "CANCELADO";
export type OrdemServicoUrgenciaValue = "EMERGENCIA" | "URGENCIA" | "PROGRAMADA" | "PREVENTIVA";

export const ORDEM_SERVICO_URGENCIAS: readonly OrdemServicoUrgenciaValue[] = [
  "EMERGENCIA",
  "URGENCIA",
  "PROGRAMADA",
  "PREVENTIVA",
];

// Prazo de mobilização que vem preenchido na criação da OS
export const DEFAULT_PRAZO_MOBILIZACAO_DIAS = 7;

// Quanto de um empenho vai para a OS (em reais na entrada; centavos na persistência)
export type OrdemServicoEmpenhoInput = {
  empenho_id: string;
  valor: number;
};

export type OrdemServicoType = {
  // Vazio na criação: o número é gerado (sequência por lote e ano)
  numero: string;
  empenhos: OrdemServicoEmpenhoInput[];
  // Cronograma de execução (data sem horário, "AAAA-MM-DD"). Com `prazoDias`, o término é calculado
  dataInicio: string;
  dataPrevisaoTermino: string;
  // Obra em que a OS é executada; null = ainda sem obra
  obra_id?: string | null | undefined;
  tenant_id: string;
  // Dados do documento da OS
  lote_id?: string | null | undefined;
  setorRequisitante?: string | null | undefined;
  urgencia?: OrdemServicoUrgenciaValue | null | undefined;
  dataVistoria?: string | null | undefined;
  descricaoProblema?: string | null | undefined;
  dataEmissao?: string | null | undefined;
  prazoMobilizacaoDias?: number | undefined;
  prazoDias?: number | null | undefined;
  // Total com BDI em reais: informado só nas OS antigas; com orçamento ele sai dos itens
  totalComBdi?: number | null | undefined;
  fiscalSetorial?: string | null | undefined;
  fiscalTecnico_id?: string | null | undefined;
  fiscalAdministrativo_id?: string | null | undefined;
  condicoesEspeciais?: string[] | undefined;
  // Anexos já validados (parseAnexos); null = os seis padrão (OS anterior à escolha)
  anexos?: AnexoOs[] | null | undefined;
  comentariosTecnicos?: string[] | undefined;
};

export type PersistedOrdemServico = {
  id: string;
  numero: string;
  valor: number;
  status: OrdemServicoStatusValue;
  // Empenho principal (o primeiro vinculado) — define o contrato da OS
  empenho_id: string;
  dataInicio: Date | null;
  dataPrevisaoTermino: Date | null;
  obra_id: string | null;
  tenant_id: string;
  sequencia: number | null;
  anoNumeracao: number | null;
  lote_id: string | null;
  setorRequisitante: string | null;
  urgencia: OrdemServicoUrgenciaValue | null;
  dataVistoria: Date | null;
  descricaoProblema: string | null;
  dataEmissao: Date | null;
  prazoMobilizacaoDias: number;
  prazoDias: number | null;
  // Em reais
  totalComBdi: number | null;
  // Orçamento: como os preços foram informados e o desconto copiado do lote (porcentagem)
  precoBase: "COM_BDI" | "COM_BDI_E_DESCONTO";
  desconto: number;
  // Criada e ainda não emitida (sem orçamento): a empresa não vê
  aguardandoEmissao: boolean;
  fiscalSetorial: string | null;
  fiscalTecnico_id: string | null;
  fiscalAdministrativo_id: string | null;
  condicoesEspeciais: string[];
  anexos: AnexoOs[] | null;
  comentariosTecnicos: string[];
  // Ciência da empresa (ver domain/tramitacao/ciencia.ts); nulos nas OS anteriores à regra
  emitidaEm: Date | null;
  cienciaPrazoAte: Date | null;
  cienciaDispensada: boolean;
  visualizadaEm: Date | null;
  cienteEm: Date | null;
  cienteUser_id: string | null;
  cienteNome: string | null;
  prazoVencidoEm: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Término = início + prazo − 1: o dia de início conta como o primeiro dia do prazo. */
export function calcularTermino(dataInicio: string, prazoDias: number): string {
  const inicio = new Date(dataInicio);
  return new Date(inicio.getTime() + (prazoDias - 1) * DAY_MS).toISOString().slice(0, 10);
}

function isValidDate(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

export class OrdemServicoEntity {
  public readonly numero: string;
  public readonly empenhos: OrdemServicoEmpenhoInput[];
  public readonly dataInicio: string;
  public readonly dataPrevisaoTermino: string;
  public readonly obra_id: string | null;
  public readonly tenant_id: string;
  public readonly lote_id: string | null;
  public readonly setorRequisitante: string | null;
  public readonly urgencia: OrdemServicoUrgenciaValue | null;
  public readonly dataVistoria: string | null;
  public readonly descricaoProblema: string | null;
  public readonly dataEmissao: string | null;
  public readonly prazoMobilizacaoDias: number;
  public readonly prazoDias: number | null;
  public readonly totalComBdi: number | null;
  public readonly fiscalSetorial: string | null;
  public readonly fiscalTecnico_id: string | null;
  public readonly fiscalAdministrativo_id: string | null;
  public readonly condicoesEspeciais: string[];
  public readonly anexos: AnexoOs[] | null;
  public readonly comentariosTecnicos: string[];

  constructor(props: OrdemServicoType) {
    // O número vazio é aceito aqui porque na criação ele só é gerado depois, no repository
    if (!isValidDate(props.dataInicio)) {
      throw new DomainError("OrdemServico dataInicio is required");
    }

    const prazoDias = props.prazoDias ?? null;
    if (prazoDias !== null && (!Number.isInteger(prazoDias) || prazoDias < 1)) {
      throw new DomainError("OrdemServico prazoDias must be a positive integer");
    }
    // Com prazo em dias o término é sempre calculado a partir do início
    const dataPrevisaoTermino =
      prazoDias !== null ? calcularTermino(props.dataInicio, prazoDias) : props.dataPrevisaoTermino;
    if (!dataPrevisaoTermino || !isValidDate(dataPrevisaoTermino)) {
      throw new DomainError("OrdemServico dataInicio and dataPrevisaoTermino are required");
    }
    if (new Date(props.dataInicio) > new Date(dataPrevisaoTermino)) {
      throw new DomainError("OrdemServico dataInicio must not be after dataPrevisaoTermino");
    }

    if (props.empenhos.length === 0) {
      throw new DomainError("OrdemServico must have at least one empenho");
    }
    const ids = new Set(props.empenhos.map((e) => e.empenho_id));
    if (ids.size !== props.empenhos.length) {
      throw new DomainError("The same empenho cannot be linked twice to an OrdemServico");
    }
    // Valor 0 só faz sentido na OS que aguarda orçamento; quem decide isso é o use case
    if (props.empenhos.some((e) => !e.empenho_id || !(e.valor >= 0))) {
      throw new DomainError("Each linked empenho must have a valid valor");
    }

    if (props.urgencia && !ORDEM_SERVICO_URGENCIAS.includes(props.urgencia)) {
      throw new DomainError("OrdemServico urgencia is invalid");
    }
    for (const [field, value] of [
      ["dataVistoria", props.dataVistoria],
      ["dataEmissao", props.dataEmissao],
    ] as const) {
      if (value && !isValidDate(value)) {
        throw new DomainError(`OrdemServico ${field} is invalid`);
      }
    }
    const prazoMobilizacaoDias = props.prazoMobilizacaoDias ?? DEFAULT_PRAZO_MOBILIZACAO_DIAS;
    if (!Number.isInteger(prazoMobilizacaoDias) || prazoMobilizacaoDias < 0) {
      throw new DomainError("OrdemServico prazoMobilizacaoDias must be a non-negative integer");
    }
    if (prazoDias !== null && prazoMobilizacaoDias > prazoDias) {
      throw new DomainError("OrdemServico prazoMobilizacaoDias cannot be greater than prazoDias");
    }
    const totalComBdi = props.totalComBdi ?? null;
    if (totalComBdi !== null && !(totalComBdi > 0)) {
      throw new DomainError("OrdemServico totalComBdi must be greater than 0");
    }

    this.numero = props.numero;
    this.empenhos = props.empenhos;
    this.dataInicio = props.dataInicio;
    this.dataPrevisaoTermino = dataPrevisaoTermino;
    this.obra_id = props.obra_id || null;
    this.tenant_id = props.tenant_id;
    this.lote_id = props.lote_id || null;
    this.setorRequisitante = props.setorRequisitante?.trim() || null;
    this.urgencia = props.urgencia || null;
    this.dataVistoria = props.dataVistoria || null;
    this.descricaoProblema = props.descricaoProblema?.trim() || null;
    this.dataEmissao = props.dataEmissao || null;
    this.prazoMobilizacaoDias = prazoMobilizacaoDias;
    this.prazoDias = prazoDias;
    this.totalComBdi = totalComBdi;
    this.fiscalSetorial = props.fiscalSetorial?.trim() || null;
    this.fiscalTecnico_id = props.fiscalTecnico_id || null;
    this.fiscalAdministrativo_id = props.fiscalAdministrativo_id || null;
    this.condicoesEspeciais = (props.condicoesEspeciais ?? []).map((c) => c.trim()).filter(Boolean);
    this.anexos = props.anexos ?? null;
    this.comentariosTecnicos = (props.comentariosTecnicos ?? []).map((c) => c.trim()).filter(Boolean);
  }

  /** Valor da OS = soma do que cada empenho destina a ela. */
  get valor(): number {
    return this.empenhos.reduce((sum, e) => sum + e.valor, 0);
  }

  /** Empenho principal: o primeiro da lista. */
  get empenhoPrincipalId(): string {
    return this.empenhos[0]!.empenho_id;
  }
}
