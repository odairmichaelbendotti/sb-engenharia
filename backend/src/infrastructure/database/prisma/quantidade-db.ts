// As quantidades ficam em colunas BIGINT (5 casas: cem-milésimos) e o Prisma as devolve como bigint.
// O domínio conta em number (o maior valor aceito, QTD_MAX, fica longe do limite seguro do JS):
// a conversão é feita aqui, na leitura.

type ComQuantidade = { quantidade: bigint };
type ComSuprimida = ComQuantidade & { quantidadeSuprimida: bigint };

/** Item do orçamento com quantidade e supressão em number. */
export function itemComQtd<T extends ComSuprimida>(
  row: T,
): Omit<T, "quantidade" | "quantidadeSuprimida"> & { quantidade: number; quantidadeSuprimida: number } {
  return { ...row, quantidade: Number(row.quantidade), quantidadeSuprimida: Number(row.quantidadeSuprimida) };
}

/** Linha de medição com a quantidade em number. */
export function linhaComQtd<T extends ComQuantidade>(row: T): Omit<T, "quantidade"> & { quantidade: number } {
  return { ...row, quantidade: Number(row.quantidade) };
}

/** Medição com as linhas convertidas. */
export function medicaoComQtd<T extends { itens: ComQuantidade[] }>(
  row: T,
): Omit<T, "itens"> & { itens: (Omit<T["itens"][number], "quantidade"> & { quantidade: number })[] } {
  return { ...row, itens: row.itens.map(linhaComQtd) };
}
