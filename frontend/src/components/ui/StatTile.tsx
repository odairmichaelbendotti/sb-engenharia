import type { ReactNode } from "react";
import { cx } from "../../utils/cx";
import { HINT_TEXT, type HintTone } from "../../utils/status-display";

interface StatTileProps {
  label: string;
  value: ReactNode;
  // Linha de apoio abaixo do valor ("58% do emitido", "venceu há 3 dias")
  hint?: ReactNode;
  hintTone?: HintTone;
  // Valor com cor de significado (ex.: saldo acima do valor em vermelho)
  valueTone?: "default" | "success" | "danger";
  children?: ReactNode;
}

const VALUE_TONE = {
  default: "text-text-primary",
  success: "text-success-text",
  danger: "text-danger-text",
};

// Número de destaque no topo dos modais de visualização (até quatro por linha)
export function StatTile({ label, value, hint, hintTone = "muted", valueTone = "default", children }: StatTileProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted px-3 py-2.5 min-w-0 flex flex-col gap-0.5">
      <p className="text-[11px] text-text-secondary truncate">{label}</p>
      <p className={cx("text-base font-bold tracking-tight tabular-nums truncate", VALUE_TONE[valueTone])}>{value}</p>
      {hint && <p className={cx("text-[11px] truncate", HINT_TEXT[hintTone])}>{hint}</p>}
      {children}
    </div>
  );
}

// Grade de tiles: duas colunas no celular, até quatro no desktop
export function StatTiles({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">{children}</div>;
}
