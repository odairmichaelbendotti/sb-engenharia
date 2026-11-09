import { prisma } from "../../prisma/prisma.js";
import { valorOrcadoItem } from "../../../domain/medicao/medicao-calc.js";
import { valorEstimado, valorPlanejado } from "../../../domain/ordem-servico/os-planejada.js";
import { itemComQtd } from "./quantidade-db.js";

// Valor planejado da OS ainda não emitida, compartilhado pelas listagens de OS e de obras

// Orçado (centavos) das OS com itens, para o valor planejado das que ainda não foram emitidas
export async function orcadoPorOs(ids: string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const itens = await prisma.ordemServicoItem.findMany({
    where: { ordemServico_id: { in: ids } },
    select: { ordemServico_id: true, quantidade: true, quantidadeSuprimida: true, precoUnitario: true, valorTotal: true },
  });
  const orcado = new Map<string, number>();
  for (const item of itens) {
    orcado.set(item.ordemServico_id, (orcado.get(item.ordemServico_id) ?? 0) + valorOrcadoItem(itemComQtd(item)));
  }
  return orcado;
}

export type PlanejamentoRow = { id: string; aguardandoEmissao: boolean; estimativaComBdi: number | null; desconto: number };

// Estimativa e valor planejado da OS planejada, em reais (nulos na emitida). Recebe a linha do banco
export function planejamento(os: PlanejamentoRow, orcado: Map<string, number>) {
  if (!os.aguardandoEmissao) return { valorEstimado: null, valorPlanejado: null };
  const estimado = valorEstimado(os.estimativaComBdi, os.desconto);
  const planejado = valorPlanejado({
    orcado: orcado.get(os.id) ?? null,
    estimativaComBdi: os.estimativaComBdi,
    desconto: os.desconto,
  });
  return { valorEstimado: estimado === null ? null : estimado / 100, valorPlanejado: planejado / 100 };
}
