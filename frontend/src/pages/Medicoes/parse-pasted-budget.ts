import { normalizeCode, normalizeFreeText, normalizeUnidade } from "../../utils/normalization/text-normalizers";

// Limites do item da planilha (espelham backend/src/domain/medicao/medicao-calc.ts)
export const ORCAMENTO_ITENS_MAX = 500;
const CODIGO_MAX = 40;
const DESCRICAO_MAX = 500;
const UNIDADE_MAX = 20;

export type PastedItem = {
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
};

export type PastedLine = { linha: number; item: PastedItem | null; erro: string | null; texto: string };

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
 * unitário (colunas a mais, como o total, são ignoradas). Com só quatro colunas, não há código.
 */
function splitColumns(cells: string[]) {
  const [a = "", b = "", c = "", d = "", e = ""] = cells;
  if (cells.length === 4) return { codigo: "", descricao: a, unidade: b, quantidade: c, preco: d };
  return { codigo: a, descricao: b, unidade: c, quantidade: d, preco: e };
}

function parseLine(cells: string[], linha: number, texto: string): PastedLine {
  if (cells.length < 4) {
    return { linha, item: null, erro: "Faltam colunas: descrição, unidade, quantidade e preço", texto };
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

  if (erro) return { linha, item: null, erro, texto };
  return {
    linha,
    erro: null,
    texto,
    item: {
      codigo,
      descricao,
      unidade,
      quantidade: Math.round(quantidade! * 1000) / 1000,
      precoUnitario: Math.round(preco! * 100) / 100,
    },
  };
}

/** Texto copiado de uma planilha (colunas separadas por tabulação) → linhas com o item ou o erro. */
export function parsePastedBudget(text: string): PastedLine[] {
  const rows = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((texto, index) => ({ texto, linha: index + 1, cells: texto.split("\t").map((c) => c.trim()) }))
    .filter((row) => row.cells.some((c) => c !== ""));

  const lines = rows.map((row) => parseLine(row.cells, row.linha, row.texto));
  // Cabeçalho ("Código | Descrição | Un | Qtd | Preço"): primeira linha sem número na quantidade
  const first = lines[0];
  const firstRow = rows[0];
  if (first?.erro && firstRow && parsePastedNumber(splitColumns(firstRow.cells).quantidade) === null) {
    return lines.slice(1);
  }
  return lines;
}
