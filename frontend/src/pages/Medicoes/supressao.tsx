import { formatQuantidade } from "../../utils/decimal";
import { StatusPill } from "../../components/ui";

// Quantidade suprimida do item, em vermelho, embaixo do orçado (que já vem sem ela)
export function SupressaoNota({ suprimido, unidade }: { suprimido: number; unidade?: string }) {
  if (suprimido <= 0) return null;
  return (
    <span
      className="block text-[11px] text-danger-text tabular-nums"
      title="Quantidade suprimida do contrato: não entra no valor nem no saldo"
    >
      −{formatQuantidade(suprimido)}
      {unidade ? ` ${unidade}` : ""} suprimido
    </span>
  );
}

// Item suprimido por inteiro: no lugar do saldo, não há o que medir
export function SuprimidoPill() {
  return (
    <StatusPill tone="danger" size="sm">
      Suprimido
    </StatusPill>
  );
}
