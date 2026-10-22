import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "../../utils/cx";
import type { ControlSize } from "./control";

type IconButtonVariant = "ghost" | "secondary" | "danger";

const variantClasses: Record<IconButtonVariant, string> = {
  ghost: "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
  secondary: "border border-border bg-surface text-text-secondary hover:bg-surface-muted hover:text-text-primary",
  // Ícone neutro que fica vermelho no hover (excluir na linha da tabela)
  danger: "text-text-secondary hover:bg-danger-bg hover:text-danger-text",
};

const sizeClasses: Record<ControlSize, { box: string; icon: number }> = {
  sm: { box: "w-8 h-8", icon: 16 },
  md: { box: "w-10 h-10", icon: 18 },
};

interface IconButtonProps extends Omit<ComponentProps<"button">, "children"> {
  icon: LucideIcon;
  // Nome da ação: vira aria-label e dica ao passar o mouse
  label: string;
  variant?: IconButtonVariant;
  size?: ControlSize;
}

// Botão quadrado só com ícone (fechar modal, editar/excluir na linha, paginação)
export function IconButton({
  icon: Icon,
  label,
  variant = "ghost",
  size = "md",
  type = "button",
  className,
  ...props
}: IconButtonProps) {
  const { box, icon } = sizeClasses[size];

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex items-center justify-center shrink-0 rounded-lg transition-colors cursor-pointer",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200",
        box,
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <Icon size={icon} />
    </button>
  );
}
