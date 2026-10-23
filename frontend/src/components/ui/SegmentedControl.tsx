import { Loader2, type LucideIcon } from "lucide-react";
import { cx } from "../../utils/cx";

// Cor do ícone na opção selecionada; o resto do controle é neutro
export type SegmentTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<SegmentTone, string> = {
  neutral: "text-text-primary",
  info: "text-info-text",
  success: "text-success-text",
  warning: "text-warning-text",
  danger: "text-danger-text",
};

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  tone?: SegmentTone;
};

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // Opção que está sendo salva: mostra o indicador de carregamento e trava o controle
  loadingValue?: T | null;
  disabled?: boolean;
  label?: string;
}

/**
 * Escolha única entre poucas opções (ex.: status Ativo/Finalizado/Cancelado).
 * Trilho cinza com a opção selecionada em destaque branco, mesma altura dos inputs.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  loadingValue = null,
  disabled = false,
  label,
}: SegmentedControlProps<T>) {
  const locked = disabled || loadingValue !== null;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-surface-muted border border-border"
    >
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon, tone = "neutral" }) => {
        const selected = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={locked}
            onClick={() => onChange(optionValue)}
            className={cx(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold transition-colors",
              "cursor-pointer disabled:cursor-not-allowed",
              selected
                ? "bg-surface text-text-primary shadow-xs ring-1 ring-border"
                : "text-text-secondary hover:text-text-primary disabled:hover:text-text-secondary",
              locked && !selected && "opacity-60",
            )}
          >
            {loadingValue === optionValue ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              Icon && <Icon size={14} className={selected ? toneClasses[tone] : undefined} />
            )}
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}
