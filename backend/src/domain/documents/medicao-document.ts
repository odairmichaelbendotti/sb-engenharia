import { fromMilesimos } from "../medicao/medicao-calc.js";
import { calcularPlanilhaMedicao } from "../medicao/planilha-medicao.js";
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
  orcado: string;
  precoUnitario: string;
  anterior: string;
  esta: string;
  acumulado: string;
  saldo: string;
  valorEsta: string;
  valorAcumulado: string;
  valorSaldo: string;
  // Item medido nesta medição (linha em destaque) e item sem saldo
  medidoNesta: boolean;
  concluido: boolean;
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
  totais: { orcado: string; anterior: string; esta: string; acumulado: string; saldo: string };
  observacao: string;
  fiscais: { tecnico: string; administrativo: string };
  local: string;
};

const qtdFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
const moedaSemSimbolo = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Quantidade em milésimos → "3,50"; "3,125" quando há a terceira casa. */
export function formatQuantidade(milesimos: number): string {
  return qtdFormat.format(fromMilesimos(milesimos));
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
      precoUnitario: valorTabela(l.precoUnitario),
      anterior: ouTraco(l.anterior, formatQuantidade(l.anterior)),
      esta: ouTraco(l.esta, formatQuantidade(l.esta)),
      acumulado: formatQuantidade(l.acumulado),
      saldo: formatQuantidade(l.saldo),
      valorEsta: ouTraco(l.valorEsta, valorTabela(l.valorEsta)),
      valorAcumulado: valorTabela(l.valorAcumulado),
      valorSaldo: valorTabela(l.valorSaldo),
      medidoNesta: l.esta > 0,
      concluido: l.saldo <= 0,
    })),
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
