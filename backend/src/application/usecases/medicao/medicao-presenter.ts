import { computeLinhasMedicao, fromQtdInterna, type TotaisMedicao } from "../../../domain/medicao/medicao-calc.js";
import type { LinhaPlanilhaMedicao } from "../../../domain/medicao/planilha-medicao.js";
import type { MedicaoResumo, PlanilhaOs } from "../../../domain/repositories/IMedicaoRepository.js";

// A API fala em reais e em quantidades decimais; o domínio, em centavos e milésimos
export const reais = (centavos: number) => centavos / 100;
export const qtd = fromQtdInterna;

/** Valor (centavos) de cada medição, com os preços atuais; a ordem por número dá o acumulado anterior. */
export function valoresDasMedicoes(planilha: PlanilhaOs): Map<string, number> {
  const valores = new Map<string, number>();
  const anterior = new Map<string, number>();
  for (const medicao of planilha.medicoes) {
    const esta = new Map(medicao.itens.map((l) => [l.item_id, l.quantidade]));
    const { totais } = computeLinhasMedicao({ itens: planilha.itens, anterior, esta });
    valores.set(medicao.id, totais.valorEsta);
    if (medicao.status === "FECHADA") {
      for (const [item_id, quantidade] of esta) anterior.set(item_id, (anterior.get(item_id) ?? 0) + quantidade);
    }
  }
  return valores;
}

export function presentMedicaoResumo(medicao: MedicaoResumo, valor: number) {
  return {
    id: medicao.id,
    ordemServico_id: medicao.ordemServico_id,
    numero: medicao.numero,
    status: medicao.status,
    periodoInicio: medicao.periodoInicio,
    periodoFim: medicao.periodoFim,
    observacao: medicao.observacao,
    valor: reais(valor),
    createdAt: medicao.createdAt,
    criadoPorNome: medicao.criadoPorNome,
    fechadaEm: medicao.fechadaEm,
    fechadaPorNome: medicao.fechadaPorNome,
    reabertaEm: medicao.reabertaEm,
    reabertaPorNome: medicao.reabertaPorNome,
  };
}

export function presentLinha(linha: LinhaPlanilhaMedicao) {
  return {
    item_id: linha.item_id,
    ordem: linha.ordem,
    codigo: linha.codigo,
    descricao: linha.descricao,
    etapa: linha.etapa,
    unidade: linha.unidade,
    precoUnitario: reais(linha.precoUnitario),
    orcado: qtd(linha.orcado),
    suprimido: qtd(linha.suprimido),
    anterior: qtd(linha.anterior),
    esta: qtd(linha.esta),
    acumulado: qtd(linha.acumulado),
    saldo: qtd(linha.saldo),
    valorOrcado: reais(linha.valorOrcado),
    valorAnterior: reais(linha.valorAnterior),
    valorEsta: reais(linha.valorEsta),
    valorAcumulado: reais(linha.valorAcumulado),
    valorSaldo: reais(linha.valorSaldo),
  };
}

export function presentTotaisMedicao(totais: TotaisMedicao) {
  return {
    valorOrcado: reais(totais.valorOrcado),
    valorAnterior: reais(totais.valorAnterior),
    valorEsta: reais(totais.valorEsta),
    valorAcumulado: reais(totais.valorAcumulado),
    valorSaldo: reais(totais.valorSaldo),
  };
}
