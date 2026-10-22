import { cx } from "../../utils/cx";

// Tamanhos padrão de todos os controles (input, select, botão): mesma altura e mesma fonte
export type ControlSize = "sm" | "md";

export const controlHeight: Record<ControlSize, string> = {
  sm: "h-8 text-xs",
  md: "h-10 text-sm",
};

export const controlIconSize: Record<ControlSize, number> = {
  sm: 14,
  md: 16,
};

// Aparência compartilhada por Input, Select e Textarea
export function controlClasses(invalid: boolean) {
  return cx(
    "w-full rounded-lg border bg-surface text-text-primary placeholder:text-text-muted",
    "transition-colors focus:outline-none focus:ring-3",
    "disabled:bg-surface-muted disabled:text-text-muted disabled:cursor-not-allowed",
    invalid
      ? "border-danger-border focus:border-danger-text focus:ring-danger-bg"
      : "border-border hover:border-border-strong focus:border-primary-400 focus:ring-primary-100",
  );
}
