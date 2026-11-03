import { arredondaQtd } from "../../utils/decimal";

export type FiltroMedicao = "pendentes" | "nesta" | "todos";

export function saldoAposMedicao(disponivel: number, esta: number) {
  return arredondaQtd(disponivel - esta);
}

export function correspondeFiltroMedicao(linha: { saldo: number; esta: number }, filtro: FiltroMedicao) {
  if (filtro === "pendentes") return linha.saldo > 0;
  if (filtro === "nesta") return linha.esta > 0;
  return true;
}
