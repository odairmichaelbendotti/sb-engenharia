import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import {
  ESCOPOS_ORCAMENTO,
  manterTotaisAjustados,
  totaisOrcamento,
  validateOrcamentoContrato,
  type EscopoOrcamento,
  type PrecoBase,
} from "../../../domain/medicao/medicao-calc.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { IMedicaoRepository, MedicaoOsContext } from "../../../domain/repositories/IMedicaoRepository.js";
import { calcularPrazoCiencia, isCienciaDispensada } from "../../../domain/tramitacao/ciencia.js";
import { autorDe } from "../ordem-servico-tramitacao/tramitacao-access.js";
import {
  assertPodeEditar,
  loadOsComAcesso,
  parseOrcamentoItens,
} from "./medicao-access.js";

type Distribuicao = { empenho_id: string; valor: number }[];

/** Distribuição enviada pelo usuário (reais) em centavos, com exatamente os empenhos da OS. */
function lerDistribuicao(os: MedicaoOsContext, enviada: unknown[]): Distribuicao {
  const atuais = os.empenhos;
  const porId = new Map<string, number>();
  for (const value of enviada) {
    const item = (value ?? {}) as Record<string, unknown>;
    const valor = typeof item.valor === "number" ? item.valor : Number(item.valor);
    if (typeof item.empenho_id !== "string" || !Number.isFinite(valor) || valor < 0) {
      throw new DomainError("Invalid empenho distribution");
    }
    porId.set(item.empenho_id, Math.round(valor * 100));
  }
  if (porId.size !== atuais.length || atuais.some((v) => !porId.has(v.empenho_id))) {
    throw new DomainError("The distribution must have exactly the empenhos of the ordem de serviço");
  }
  return atuais.map((v) => ({ empenho_id: v.empenho_id, valor: porId.get(v.empenho_id)! }));
}

/**
 * Quanto cada empenho destina à OS (centavos).
 * - Escopo da OS: os empenhos somam o valor do orçamento. Com um empenho só, ele recebe tudo; com
 *   vários, a distribuição vem do usuário quando o valor muda.
 * - Escopo do contrato: os empenhos somam o empenhado, que fica abaixo do orçamento até chegarem os
 *   próximos. Sem distribuição enviada, ficam como estão.
 */
function distribuir(os: MedicaoOsContext, escopo: EscopoOrcamento, valorOs: number, enviada: unknown): Distribuicao {
  const atuais = os.empenhos.map((v) => ({ empenho_id: v.empenho_id, valor: v.valor }));
  if (enviada !== undefined && enviada !== null && !Array.isArray(enviada)) {
    throw new DomainError("Empenhos must be a list");
  }
  if (escopo === "CONTRATO") return Array.isArray(enviada) ? lerDistribuicao(os, enviada) : atuais;

  if (atuais.length === 1) return [{ empenho_id: atuais[0]!.empenho_id, valor: valorOs }];
  if (!Array.isArray(enviada)) {
    if (atuais.reduce((acc, v) => acc + v.valor, 0) === valorOs) return atuais;
    throw new DomainError("Distribute the budget value among the empenhos of the ordem de serviço");
  }
  const distribuicao = lerDistribuicao(os, enviada);
  if (distribuicao.reduce((acc, v) => acc + v.valor, 0) !== valorOs) {
    throw new DomainError("The empenhos must add up to the budget value");
  }
  return distribuicao;
}

function lerEscopo(os: MedicaoOsContext, enviado: unknown): EscopoOrcamento {
  if (enviado === undefined || enviado === null) return os.escopoOrcamento;
  if (!ESCOPOS_ORCAMENTO.includes(enviado as EscopoOrcamento)) throw new DomainError("Invalid budget scope");
  return enviado as EscopoOrcamento;
}

/**
 * Grava a planilha orçamentária inteira; as regras contra o que já foi medido ficam no domínio
 * (validateOrcamentoChange), conferidas pelo repository dentro da transação. O orçamento é a base
 * de preço da OS. No escopo da OS, o valor dela passa a ser a soma dos itens, repartido entre os
 * empenhos; no do contrato, o orçamento é o valor total (até o valor do contrato) e a OS vale o
 * empenhado. A OS já emitida é reemitida para a empresa quando o orçamento, o escopo ou o valor dela
 * mudam.
 */
export class SaveOrcamentoUseCase {
  constructor(
    private repository: IMedicaoRepository,
    private empenhoRepository: IEmpenhoRepository,
  ) {}

  async execute({
    ordemServicoId,
    user,
    body,
  }: {
    ordemServicoId: string;
    user: AuthenticatedUser;
    body: Record<string, unknown>;
  }) {
    const os = await loadOsComAcesso(this.repository, ordemServicoId, user);
    assertPodeEditar(user, os);

    // Um modo só (2026-10-28): o preço digitado é sempre com BDI e o sistema aplica o desconto
    const precoBase: PrecoBase = "COM_BDI";
    // A regra não é escolhida na tela: OS nova usa o desconto simples; as convertidas das planilhas
    // SCOAM ficam com a regra delas, que reproduz os preços gravados
    const regraDesconto = os.regraDesconto;
    // Total ajustado já gravado (planilha antiga) continua enquanto o item não muda
    const atuais = (await this.repository.getPlanilhas([os.id])).get(os.id)?.itens ?? [];
    const itens = manterTotaisAjustados(
      atuais,
      parseOrcamentoItens(body.itens, { precoBase, desconto: os.desconto, regra: regraDesconto }),
    );
    if (itens.length === 0) throw new DomainError("The budget must have at least one item");

    const escopo = lerEscopo(os, body.escopo);
    const { totalComBdi, valorOs } = totaisOrcamento({ itens, precoBase, desconto: os.desconto, regra: regraDesconto });
    const empenhos = distribuir(os, escopo, valorOs, body.empenhos);

    // O que cada empenho destina precisa caber no saldo livre dele (sem contar esta OS)
    for (const vinculo of empenhos) {
      const saldo = Math.round((await this.empenhoRepository.getSaldoDisponivel(vinculo.empenho_id, os.id)) * 100);
      if (vinculo.valor > saldo) {
        const numero = os.empenhos.find((v) => v.empenho_id === vinculo.empenho_id)?.numero ?? "";
        throw new DomainError(
          `O valor do orçamento destinado ao empenho ${numero} (${vinculo.valor / 100}) excede o saldo disponível dele (${saldo / 100}).`,
        );
      }
    }

    const empenhado = empenhos.reduce((acc, v) => acc + v.valor, 0);
    if (escopo === "CONTRATO") {
      validateOrcamentoContrato({ valorOrcado: valorOs, empenhado, contratoValor: os.contrato.valor });
    }

    // OS que já tramita com a empresa: mudou o valor, ela é reemitida e a ciência recomeça. No
    // orçamento do contrato o valor da OS (empenhado) e o orçado mudam separados
    const orcadoAntes = totaisOrcamento({ itens: atuais, precoBase, desconto: os.desconto, regra: regraDesconto }).valorOs;
    const mudouValor =
      empenhado !== os.valor || escopo !== os.escopoOrcamento || (escopo === "CONTRATO" && valorOs !== orcadoAntes);
    const reemitir =
      os.status === "ATIVO" &&
      !os.aguardandoEmissao &&
      !isCienciaDispensada({ ...os, cienteEm: null, contestacoesAbertas: 0 }) &&
      mudouValor;
    const emitidaEm = new Date();

    await this.repository.saveOrcamento({
      ordemServico_id: os.id,
      precoBase,
      regraDesconto,
      escopoOrcamento: escopo,
      itens,
      totalComBdi,
      empenhos,
      emissao: reemitir
        ? { tipo: "REEMITIDA", emitidaEm, cienciaPrazoAte: calcularPrazoCiencia(emitidaEm), autor: autorDe(user) }
        : null,
    });
    return { reemitida: reemitir };
  }
}
