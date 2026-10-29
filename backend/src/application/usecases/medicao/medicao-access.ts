import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import {
  INT_MAX,
  precoComDesconto,
  REGRAS_DESCONTO,
  toMilesimos,
  totalPorRegra,
  valorItem,
  type LinhaMedicaoInput,
  type OrcamentoItemInput,
  type PrecoBase,
  type RegraDesconto,
} from "../../../domain/medicao/medicao-calc.js";
import {
  MEDICAO_RULES,
  normalizeInput,
  ORDEM_SERVICO_ITEM_RULES,
} from "../../../domain/normalization/input-rules.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type {
  IMedicaoRepository,
  MedicaoAutor,
  MedicaoDadosInput,
  MedicaoOsContext,
} from "../../../domain/repositories/IMedicaoRepository.js";

export const OBSERVACAO_MAX = 2000;

const policy = new DomainAccessPolicy();

/**
 * Carrega a OS e confere o acesso de leitura: a organização só vê as próprias OS (PLATFORM_ADMIN
 * vê todas) e a empresa só as dos próprios contratos, já emitidas. OS de fora do escopo responde
 * como inexistente.
 */
export async function loadOsComAcesso(
  repository: IMedicaoRepository,
  ordemServico_id: string,
  user: AuthenticatedUser,
): Promise<MedicaoOsContext> {
  if (user.role === "EMPRESA" && !user.company_id) {
    throw new DomainError("This user is not linked to a company");
  }
  const os = await repository.findOsContext(ordemServico_id);
  const foraDoTenant = user.role !== "PLATFORM_ADMIN" && os?.tenant_id !== user.tenant_id;
  const foraDaEmpresa =
    user.role === "EMPRESA" && (os?.company_id !== user.company_id || os?.aguardandoEmissao);
  if (!os || foraDoTenant || foraDaEmpresa) {
    throw new DomainError("OrdemServico not found");
  }
  return os;
}

export async function loadOsDaMedicao(repository: IMedicaoRepository, medicao_id: string, user: AuthenticatedUser) {
  const ordemServico_id = await repository.findOrdemServicoIdDaMedicao(medicao_id);
  if (!ordemServico_id) throw new DomainError("Medição not found");
  try {
    return await loadOsComAcesso(repository, ordemServico_id, user);
  } catch {
    throw new DomainError("Medição not found");
  }
}

export function podeEditar(user: AuthenticatedUser): boolean {
  return policy.can(user.role, "engenharia", "edit");
}

/** Escrita: perfil que edita a engenharia, na própria organização e com a OS ativa. */
export function assertPodeEditar(user: AuthenticatedUser, os: MedicaoOsContext) {
  if (!podeEditar(user) || os.tenant_id !== user.tenant_id) {
    throw new DomainError("You are not authorized to change the budget or the medições of this ordem de serviço");
  }
  if (os.status !== "ATIVO") {
    throw new DomainError("Budget and medições can only change while the ordem de serviço is active");
  }
}

export function autorDe(user: AuthenticatedUser): MedicaoAutor {
  return { id: user.id, nome: user.name };
}

function texto(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numero(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return NaN;
}

export function parseRegraDesconto(raw: unknown, atual: RegraDesconto): RegraDesconto {
  if (raw === undefined || raw === null) return atual;
  if (!REGRAS_DESCONTO.includes(raw as RegraDesconto)) throw new DomainError("regraDesconto is invalid");
  return raw as RegraDesconto;
}

/**
 * Planilha enviada pela API: quantidade e quantidade suprimida (opcional) decimais, preço unitário
 * (como informado) e total ajustado (opcional) em reais. No modo COM_BDI o preço informado vira a referência e o preço que vale
 * recebe o desconto da OS pela regra dela; o total é o calculado ou, na SCOAM, o truncado (o enviado
 * é ignorado). Total igual a quantidade × preço é gravado como nulo (sem ajuste).
 */
export function parseOrcamentoItens(
  raw: unknown,
  { precoBase, desconto, regra }: { precoBase: PrecoBase; desconto: number; regra: RegraDesconto },
): OrcamentoItemInput[] {
  if (!Array.isArray(raw)) throw new DomainError("Itens must be a list");
  return raw.map((value, index) => {
    const item = (value ?? {}) as Record<string, unknown>;
    const quantidade = numero(item.quantidade);
    const preco = numero(item.precoUnitario);
    const suprimida = item.quantidadeSuprimida === null || item.quantidadeSuprimida === undefined ? 0 : numero(item.quantidadeSuprimida);
    if (!Number.isFinite(quantidade) || !Number.isFinite(preco) || !Number.isFinite(suprimida)) {
      throw new DomainError(`Item ${index + 1}: quantidade and preço unitário must be numbers`);
    }
    const total = item.valorTotal === null || item.valorTotal === undefined ? null : numero(item.valorTotal);
    if (total !== null && !Number.isFinite(total)) {
      throw new DomainError(`Item ${index + 1}: valor total must be a number`);
    }
    const normalized = normalizeInput(
      {
        codigo: texto(item.codigo),
        descricao: texto(item.descricao),
        etapa: texto(item.etapa),
        unidade: texto(item.unidade),
      },
      ORDEM_SERVICO_ITEM_RULES,
    );
    const quantidadeMil = toMilesimos(quantidade);
    const informadoCent = Math.round(preco * 100);
    const aplicaDesconto = precoBase === "COM_BDI";
    const precoCent = aplicaDesconto ? precoComDesconto(informadoCent, desconto, regra) : informadoCent;
    const quantidadeSuprimida = toMilesimos(suprimida);
    const totalCent = aplicaDesconto
      ? totalPorRegra({ quantidade: quantidadeMil, quantidadeSuprimida, precoUnitario: precoCent }, regra)
      : total === null
        ? null
        : Math.round(total * 100);
    return {
      id: typeof item.id === "string" && item.id ? item.id : undefined,
      codigo: normalized.codigo || null,
      descricao: normalized.descricao,
      etapa: normalized.etapa || null,
      unidade: normalized.unidade,
      quantidade: quantidadeMil,
      quantidadeSuprimida,
      precoUnitario: precoCent,
      valorTotal: totalCent === valorItem(quantidadeMil, precoCent) ? null : totalCent,
      precoReferencia: aplicaDesconto ? informadoCent : null,
    };
  });
}

const DATA_PURA = /^\d{4}-\d{2}-\d{2}$/;

function parseData(value: unknown, campo: string): Date {
  const text = texto(value).slice(0, 10);
  const date = new Date(text);
  if (!DATA_PURA.test(text) || Number.isNaN(date.getTime())) throw new DomainError(`${campo} is invalid`);
  return date;
}

/** Período, observação e quantidades (decimais) de uma medição; linhas zeradas são ignoradas. */
export function parseMedicaoDados(body: Record<string, unknown>): MedicaoDadosInput {
  const periodoInicio = parseData(body.periodoInicio, "Período início");
  const periodoFim = parseData(body.periodoFim, "Período fim");
  if (periodoInicio > periodoFim) throw new DomainError("Período início must be before período fim");

  const { observacao } = normalizeInput({ observacao: texto(body.observacao) }, MEDICAO_RULES);
  if (observacao.length > OBSERVACAO_MAX) {
    throw new DomainError(`Observação must have at most ${OBSERVACAO_MAX} characters`);
  }

  if (!Array.isArray(body.itens)) throw new DomainError("Itens must be a list");
  const linhas: LinhaMedicaoInput[] = [];
  for (const value of body.itens) {
    const linha = (value ?? {}) as Record<string, unknown>;
    const quantidade = numero(linha.quantidade);
    if (!Number.isFinite(quantidade) || quantidade < 0) throw new DomainError("Invalid quantity in the medição");
    const milesimos = toMilesimos(quantidade);
    if (milesimos > INT_MAX) throw new DomainError("Invalid quantity in the medição");
    if (milesimos === 0) continue;
    linhas.push({ item_id: texto(linha.item_id), quantidade: milesimos });
  }

  return { periodoInicio, periodoFim, observacao: observacao || null, linhas };
}
