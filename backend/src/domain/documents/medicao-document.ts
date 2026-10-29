import { fromQtdInterna } from "../medicao/medicao-calc.js";
import { calcularPlanilhaMedicao, gruposPorEtapa } from "../medicao/planilha-medicao.js";
import type { MedicaoDocumentData } from "../repositories/IMedicaoRepository.js";
import {
  formatCnpj,
  formatDataCurta,
  formatDataExtensa,
  formatEdificacao,
  formatMoeda,
  formatPercentual,
} from "./ordem-servico-document.js";

export type MedicaoDocumentLinha = {
  item: string;
  codigo: string;
  descricao: string;
  unidade: string;
  // Quantidade efetiva (contratada − suprimida)
  orcado: string;
  // Quantidade suprimida ("" sem supressão)
  suprimido: string;
  precoUnitario: string;
  anterior: string;
  esta: string;
  acumulado: string;
  saldo: string;
  valorEsta: string;
  valorAcumulado: string;
  valorSaldo: string;
  // Item medido nesta medição (linha em destaque), item sem saldo e item suprimido por inteiro
  medidoNesta: boolean;
  concluido: boolean;
  suprimidoTotal: boolean;
};

// Faixa de etapa antes da linha `inicio` (índice em `linhas`), com os subtotais dos itens dela
export type MedicaoDocumentEtapa = {
  titulo: string;
  inicio: number;
  esta: string;
  acumulado: string;
  saldo: string;
};

// Tudo o que o PDF da medição mostra, já formatado
export type MedicaoDocumentModel = {
  titulo: string;
  numero: string;
  rascunho: boolean;
  ordemServico: string;
  contrato: string;
  processo: string;
  empresa: string;
  cnpj: string;
  edificacao: string;
  obra: string;
  lote: string;
  periodo: { inicio: string; fim: string };
  dataFechamento: string;
  resumo: { orcado: string; esta: string; acumulado: string; percentualAcumulado: string; saldo: string };
  linhas: MedicaoDocumentLinha[];
  // Só os grupos com etapa: orçamento sem etapas sai como lista única
  etapas: MedicaoDocumentEtapa[];
  totais: { orcado: string; anterior: string; esta: string; acumulado: string; saldo: string };
  observacao: string;
  fiscais: { tecnico: string; administrativo: string };
  local: string;
};

// A conta usa 5 casas; o documento mostra 2
const qtdFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moedaSemSimbolo = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Quantidade interna → "3,50" (sempre 2 casas; 10,44736 → "10,45"). */
export function formatQuantidade(milesimos: number): string {
  return qtdFormat.format(fromQtdInterna(milesimos));
}

// Valores da tabela sem "R$": a coluna já diz que é em reais
function valorTabela(centavos: number): string {
  return moedaSemSimbolo.format(centavos / 100);
}

// Zero nas colunas de movimento vira traço, para o que foi medido saltar aos olhos
function ouTraco(valor: number, texto: string): string {
  return valor === 0 ? "–" : texto;
}

/** Dia no fuso de Brasília de um horário real (fechamento), como data pura para os formatadores. */
function diaEmBrasilia(date: Date): Date {
  return new Date(date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }));
}

/**
 * Monta o boletim de medição. `emitidoEm` é a data do documento quando a medição ainda é
 * rascunho; a fechada usa a data do fechamento.
 */
export function buildMedicaoDocumentModel(data: MedicaoDocumentData, emitidoEm: Date): MedicaoDocumentModel {
  const { medicao, planilha, ordemServico, contrato, obra, lote, tenant } = data;
  const { linhas, totais } = calcularPlanilhaMedicao(planilha);
  const numero = String(medicao.numero).padStart(2, "0");
  const rascunho = medicao.status !== "FECHADA";
  const dataDocumento = diaEmBrasilia(medicao.fechadaEm ?? emitidoEm);
  const percentual = totais.valorOrcado > 0 ? (totais.valorAcumulado / totais.valorOrcado) * 100 : 0;

  return {
    titulo: `BOLETIM DE MEDIÇÃO Nº ${numero} – ${ordemServico.numero}`,
    numero,
    rascunho,
    ordemServico: ordemServico.numero,
    contrato: contrato.identificador,
    processo: contrato.ePag,
    empresa: contrato.company.name,
    cnpj: formatCnpj(contrato.company.cnpj),
    edificacao: formatEdificacao(obra),
    obra: obra?.nome ?? "",
    lote: lote ? `${String(lote.numero).padStart(2, "0")} – ${lote.nome}` : "",
    periodo: { inicio: formatDataCurta(medicao.periodoInicio), fim: formatDataCurta(medicao.periodoFim) },
    dataFechamento: medicao.fechadaEm ? formatDataCurta(dataDocumento) : "",
    resumo: {
      orcado: formatMoeda(totais.valorOrcado / 100),
      esta: formatMoeda(totais.valorEsta / 100),
      acumulado: formatMoeda(totais.valorAcumulado / 100),
      percentualAcumulado: formatPercentual(Math.round(percentual * 100) / 100),
      saldo: formatMoeda(totais.valorSaldo / 100),
    },
    linhas: linhas.map((l) => ({
      item: String(l.ordem),
      codigo: l.codigo ?? "",
      descricao: l.descricao,
      unidade: l.unidade,
      orcado: formatQuantidade(l.orcado),
      suprimido: l.suprimido > 0 ? formatQuantidade(l.suprimido) : "",
      precoUnitario: valorTabela(l.precoUnitario),
      anterior: ouTraco(l.anterior, formatQuantidade(l.anterior)),
      esta: ouTraco(l.esta, formatQuantidade(l.esta)),
      acumulado: formatQuantidade(l.acumulado),
      saldo: formatQuantidade(l.saldo),
      valorEsta: ouTraco(l.valorEsta, valorTabela(l.valorEsta)),
      valorAcumulado: valorTabela(l.valorAcumulado),
      valorSaldo: valorTabela(l.valorSaldo),
      medidoNesta: l.esta > 0,
      concluido: l.saldo <= 0 && l.orcado > 0,
      suprimidoTotal: l.orcado === 0 && l.suprimido > 0,
    })),
    etapas: etapasDoDocumento(linhas),
    totais: {
      orcado: valorTabela(totais.valorOrcado),
      anterior: valorTabela(totais.valorAnterior),
      esta: valorTabela(totais.valorEsta),
      acumulado: valorTabela(totais.valorAcumulado),
      saldo: valorTabela(totais.valorSaldo),
    },
    observacao: medicao.observacao ?? "",
    fiscais: { tecnico: planilha.fiscais.tecnico ?? "", administrativo: planilha.fiscais.administrativo ?? "" },
    local: `${tenant.city}, ${formatDataExtensa(dataDocumento)}.`,
  };
}

function etapasDoDocumento(
  linhas: readonly { etapa: string | null; valorEsta: number; valorAcumulado: number; valorSaldo: number }[],
): MedicaoDocumentEtapa[] {
  const etapas: MedicaoDocumentEtapa[] = [];
  let inicio = 0;
  for (const grupo of gruposPorEtapa(linhas)) {
    if (grupo.etapa !== null) {
      const soma = (campo: "valorEsta" | "valorAcumulado" | "valorSaldo") =>
        valorTabela(grupo.itens.reduce((acc, l) => acc + l[campo], 0));
      etapas.push({
        titulo: grupo.etapa,
        inicio,
        esta: soma("valorEsta"),
        acumulado: soma("valorAcumulado"),
        saldo: soma("valorSaldo"),
      });
    }
    inicio += grupo.itens.length;
  }
  return etapas;
}
