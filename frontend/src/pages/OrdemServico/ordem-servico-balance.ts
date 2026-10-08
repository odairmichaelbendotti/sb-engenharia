import type { OrdemServico } from "../../../types/ordem-servico";

// Situação do saldo: com saldo, sem nenhuma nota, quitada (liquidado = valor) ou liquidada acima do valor
export type BalanceKind = "open" | "empty" | "paid" | "over";

export type Balance = {
  kind: BalanceKind;
  valor: number;
  liquidado: number;
  // Quanto falta liquidar (nunca negativo)
  saldo: number;
  // Quanto passou do valor (só em "over")
  excesso: number;
  percent: number;
};

// Compara em centavos para não sofrer com arredondamento de ponto flutuante
const toCents = (v: number) => Math.round(v * 100);

export function getBalance(valor: number, liquidado: number): Balance {
  const diff = toCents(valor) - toCents(liquidado);
  const percent = valor > 0 ? Math.round((liquidado / valor) * 100) : 0;
  const kind: BalanceKind =
    diff < 0 ? "over" : diff === 0 && valor > 0 ? "paid" : toCents(liquidado) === 0 ? "empty" : "open";

  return {
    kind,
    valor,
    liquidado,
    saldo: Math.max(0, diff) / 100,
    excesso: Math.max(0, -diff) / 100,
    percent,
  };
}

export function getOrdemServicoBalance(os: Pick<OrdemServico, "valor" | "valorExecutado">): Balance {
  return getBalance(os.valor, os.valorExecutado);
}

// OS ativa e totalmente paga: pronta para ser finalizada
export function isQuitada(os: Pick<OrdemServico, "status" | "valor" | "valorExecutado">) {
  return os.status === "ATIVO" && getOrdemServicoBalance(os).kind === "paid";
}
