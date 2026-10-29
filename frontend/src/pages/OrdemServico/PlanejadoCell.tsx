import type { OrdemServico } from "../../../types/ordem-servico";
import { formatCurrency } from "../../utils/format-currency";
import { origemPlanejado } from "./os-planejada";

type PlanejadoInfo = Pick<
  OrdemServico,
  "valorPlanejado" | "valorEstimado" | "temOrcamento" | "estimativaComBdi" | "estimativaReferencia"
>;

const ORIGEM_LABEL = { orcado: "orçado", estimado: "estimado", "sem valor": "sem estimativa" } as const;

/**
 * Valor da OS planejada na coluna de saldo da lista: no lugar do "a liquidar", o planejado (orçado
 * ou estimado), em tom neutro, sem barra: ele ainda não entra no emitido.
 */
export function PlanejadoCell({ os }: { os: PlanejadoInfo }) {
  const origem = origemPlanejado(os);
  return (
    <span className="inline-flex flex-col items-end" title="OS planejada: o valor fica fora do emitido até a emissão">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Planejado</span>
      <span className="font-semibold text-text-secondary tabular-nums">
        {origem === "sem valor" ? "—" : formatCurrency(os.valorPlanejado ?? 0)}
      </span>
      <span className="text-[11px] text-text-muted">{ORIGEM_LABEL[origem]}</span>
    </span>
  );
}

/** Topo do modal da OS planejada: o valor planejado, de onde vem e a estimativa original. */
export function PlanejadoSection({ os }: { os: PlanejadoInfo }) {
  const origem = origemPlanejado(os);
  return (
    <div>
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Valor planejado</p>
      <p className="text-2xl font-bold tabular-nums tracking-tight mt-0.5 text-text-primary">
        {origem === "sem valor" ? "Sem estimativa" : formatCurrency(os.valorPlanejado ?? 0)}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary tabular-nums">
        {os.valorEstimado !== null && <span>Estimado {formatCurrency(os.valorEstimado)}</span>}
        {os.temOrcamento && <span>Orçado {formatCurrency(os.valorPlanejado ?? 0)}</span>}
        {os.estimativaReferencia && <span className="text-text-muted">{os.estimativaReferencia}</span>}
      </div>
      <p className="text-xs text-text-muted mt-2">
        OS planejada: o valor fica fora do emitido e não reserva o saldo dos empenhos. Ela passa a valer quando o
        orçamento é lançado e a OS é emitida.
      </p>
    </div>
  );
}
