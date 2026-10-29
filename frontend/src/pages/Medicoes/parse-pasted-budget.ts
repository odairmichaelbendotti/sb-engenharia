import { arredondaQtd, folgaValorTotal, valorItem } from "../../utils/decimal";
import { formatCurrency } from "../../utils/format-currency";
import { normalizeCode, normalizeFreeText, normalizeUnidade } from "../../utils/normalization/text-normalizers";

// Limites do item da planilha (espelham backend/src/domain/medicao/medicao-calc.ts)
export const ORCAMENTO_ITENS_MAX = 500;
const CODIGO_MAX = 40;
const DESCRICAO_MAX = 500;
const UNIDADE_MAX = 20;
export const ETAPA_MAX = 120;

export type PastedItem = {
  codigo: string;
  descricao: string;
  // Título da planilha logo acima do item; vazio = sem etapa
  etapa: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  // Total da planilha quando difere de quantidade × preço (truncamento, preço com mais casas)
  valorTotal: number | null;
};

// Linha colada: um item, um título de etapa (`etapa`) ou um erro
export type PastedLine = {
  linha: number;
  item: PastedItem | null;
  etapa: string | null;
  erro: string | null;
  texto: string;
};

/**
 * Número como vem do Excel em pt-BR ("1.234,56", "R$ 12,50", "3,5") ou em inglês ("3.5").
 * Ponto sem vírgula só é milhar quando separa grupos de três ("1.234"). null se não for número.
 */
export function parsePastedNumber(raw: string): number | null {
  const texto = raw.replace(/R\$/gi, "").replace(/\s/g, "");
  if (!texto) return null;
  let normalizado: string;
  if (texto.includes(",")) normalizado = texto.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(texto)) normalizado = texto.replace(/\./g, "");
  else normalizado = texto;
  if (!/^-?\d+(\.\d+)?$/.test(normalizado)) return null;
  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : null;
}

/**
 * Colunas aceitas, na ordem da planilha SINAPI: código, descrição, unidade, quantidade, preço
 * unitário e total (opcional; colunas depois dele são ignoradas). Com só quatro colunas, não há código.
 */
function splitColumns(cells: string[]) {
  const [a = "", b = "", c = "", d = "", e = "", f = ""] = cells;
  if (cells.length === 4) return { codigo: "", descricao: a, unidade: b, quantidade: c, preco: d, total: "" };
  return { codigo: a, descricao: b, unidade: c, quantidade: d, preco: e, total: f };
}

/**
 * Título de etapa (ex.: "REMOÇÃO/DEMOLIÇÃO" da planilha SINAPI): linha sem código e sem unidade, ou
 * só com um texto. Os subtotais que vêm na linha do título são ignorados.
 */
function tituloEtapa(cells: string[]): string | null {
  const preenchidas = cells.filter((c) => c !== "");
  if (cells.length < 4) return preenchidas.length === 1 ? preenchidas[0]! : null;
  const col = splitColumns(cells);
  return !col.codigo && !col.unidade && col.descricao ? col.descricao : null;
}

function parseLine(cells: string[], linha: number, texto: string, etapa: string): PastedLine {
  const titulo = tituloEtapa(cells);
  if (titulo !== null) {
    const nome = normalizeFreeText(titulo);
    if (nome.length > ETAPA_MAX) {
      return { linha, item: null, etapa: null, erro: `Etapa com mais de ${ETAPA_MAX} caracteres`, texto };
    }
    return { linha, item: null, etapa: nome, erro: null, texto };
  }
  if (cells.length < 4) {
    return { linha, item: null, etapa: null, erro: "Faltam colunas: descrição, unidade, quantidade e preço", texto };
  }
  const col = splitColumns(cells);
  const descricao = normalizeFreeText(col.descricao);
  const unidade = normalizeUnidade(col.unidade);
  const codigo = normalizeCode(col.codigo);
  const quantidade = parsePastedNumber(col.quantidade);
  const preco = parsePastedNumber(col.preco);

  const erro = !descricao
    ? "Sem descrição"
    : descricao.length > DESCRICAO_MAX
      ? `Descrição com mais de ${DESCRICAO_MAX} caracteres`
      : !unidade
        ? "Sem unidade"
        : unidade.length > UNIDADE_MAX
          ? `Unidade com mais de ${UNIDADE_MAX} caracteres`
          : codigo.length > CODIGO_MAX
            ? `Código com mais de ${CODIGO_MAX} caracteres`
            : quantidade === null || quantidade <= 0
              ? "Quantidade inválida"
              : preco === null || preco < 0
                ? "Preço unitário inválido"
                : null;

  if (erro) return { linha, item: null, etapa: null, erro, texto };
  const qtd = arredondaQtd(quantidade!);
  const precoUnitario = Math.round(preco! * 100) / 100;
  // Coluna do total: o que não for número é ignorado
  const totalColado = col.total ? parsePastedNumber(col.total) : null;
  const total = totalColado === null ? null : Math.round(totalColado * 100) / 100;
  const calculado = valorItem(qtd, precoUnitario);
  if (total !== null && Math.abs(total - calculado) > folgaValorTotal(qtd) + 1e-9) {
    return {
      linha,
      item: null,
      etapa: null,
      erro: `Total ${formatCurrency(total)} não bate com quantidade × preço (${formatCurrency(calculado)})`,
      texto,
    };
  }
  return {
    linha,
    erro: null,
    etapa: null,
    texto,
    item: {
      codigo,
      descricao,
      etapa,
      unidade,
      quantidade: qtd,
      precoUnitario,
      valorTotal: total === null || total === calculado ? null : total,
    },
  };
}

/**
 * Texto copiado de uma planilha (colunas separadas por tabulação) → linhas com o item, o título de
 * etapa ou o erro. Cada item fica na etapa do último título acima dele (com títulos aninhados, o
 * mais próximo dos itens).
 */
export function parsePastedBudget(text: string): PastedLine[] {
  const rows = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((texto, index) => ({ texto, linha: index + 1, cells: texto.split("\t").map((c) => c.trim()) }))
    .filter((row) => row.cells.some((c) => c !== ""));

  let etapa = "";
  const lines = rows.map((row) => {
    const line = parseLine(row.cells, row.linha, row.texto, etapa);
    if (line.etapa !== null) etapa = line.etapa;
    return line;
  });
  // Cabeçalho ("Código | Descrição | Un | Qtd | Preço"): primeira linha sem número na quantidade
  const first = lines[0];
  const firstRow = rows[0];
  if (first?.erro && firstRow && parsePastedNumber(splitColumns(firstRow.cells).quantidade) === null) {
    return lines.slice(1);
  }
  return lines;
}
