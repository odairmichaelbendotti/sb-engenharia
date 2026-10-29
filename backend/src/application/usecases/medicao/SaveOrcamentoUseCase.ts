import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { totaisOrcamento } from "../../../domain/medicao/medicao-calc.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { IMedicaoRepository, MedicaoOsContext } from "../../../domain/repositories/IMedicaoRepository.js";
import { calcularPrazoCiencia, isCienciaDispensada } from "../../../domain/tramitacao/ciencia.js";
import { autorDe } from "../ordem-servico-tramitacao/tramitacao-access.js";
import {
  assertPodeEditar,
  loadOsComAcesso,
  parseOrcamentoItens,
  parsePrecoBase,
  parseRegraDesconto,
} from "./medicao-access.js";

type Distribuicao = { empenho_id: string; valor: number }[];

/**
 * Quanto cada empenho destina à OS para somar o valor do orçamento (centavos). Com um empenho só,
 * ele recebe tudo; com vários, a distribuição vem do usuário quando o valor muda.
 */
function distribuir(os: MedicaoOsContext, valorOs: number, enviada: unknown): Distribuicao {
  const atuais = os.empenhos.map((v) => ({ empenho_id: v.empenho_id, valor: v.valor }));
  if (atuais.length === 1) return [{ empenho_id: atuais[0]!.empenho_id, valor: valorOs }];
  if (enviada === undefined || enviada === null) {
    if (atuais.reduce((acc, v) => acc + v.valor, 0) === valorOs) return atuais;
    throw new DomainError("Distribute the budget value among the empenhos of the ordem de serviço");
  }
  if (!Array.isArray(enviada)) throw new DomainError("Empenhos must be a list");

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
  const distribuicao = atuais.map((v) => ({ empenho_id: v.empenho_id, valor: porId.get(v.empenho_id)! }));
  if (distribuicao.reduce((acc, v) => acc + v.valor, 0) !== valorOs) {
    throw new DomainError("The empenhos must add up to the budget value");
  }
  return distribuicao;
}

/**
 * Grava a planilha orçamentária inteira; as regras contra o que já foi medido ficam no domínio
 * (validateOrcamentoChange), conferidas pelo repository dentro da transação. O orçamento é a base
 * de preço da OS: o valor dela passa a ser a soma dos itens, repartido entre os empenhos, e a OS
 * já emitida é reemitida para a empresa quando esse valor muda.
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

    const precoBase = parsePrecoBase(body.precoBase, os.precoBase);
    const regraDesconto = parseRegraDesconto(body.regraDesconto, os.regraDesconto);
    if (precoBase !== os.precoBase && (await this.repository.hasMedicaoFechada(os.id))) {
      throw new DomainError("The price mode cannot change after a medição was closed");
    }
    // A regra muda os preços com desconto: com medição fechada, os preços medidos não mudam
    if (precoBase === "COM_BDI" && regraDesconto !== os.regraDesconto && (await this.repository.hasMedicaoFechada(os.id))) {
      throw new DomainError("The discount rule cannot change after a medição was closed");
    }
    const itens = parseOrcamentoItens(body.itens, { precoBase, desconto: os.desconto, regra: regraDesconto });
    if (itens.length === 0) throw new DomainError("The budget must have at least one item");

    const { totalComBdi, valorOs } = totaisOrcamento({ itens, precoBase, desconto: os.desconto });
    const empenhos = distribuir(os, valorOs, body.empenhos);

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

    // OS que já tramita com a empresa: mudou o valor, ela é reemitida e a ciência recomeça
    const reemitir =
      os.status === "ATIVO" &&
      !os.aguardandoEmissao &&
      !isCienciaDispensada({ ...os, cienteEm: null, contestacoesAbertas: 0 }) &&
      valorOs !== os.valor;
    const emitidaEm = new Date();

    await this.repository.saveOrcamento({
      ordemServico_id: os.id,
      precoBase,
      regraDesconto,
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
