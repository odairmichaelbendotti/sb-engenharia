import type { ComponentProps } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { cx } from "../../utils/cx";
import { controlHeight, controlIconSize, type ControlSize } from "./control";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

const variantClasses: Record<ButtonVariant, string> = {
  // Ação principal da tela/modal (uma por contexto)
  primary: "bg-primary-500 text-white hover:bg-primary-600 shadow-xs",
  // Ação secundária, com contorno
  secondary:
    "border border-border bg-surface text-text-primary hover:bg-surface-muted hover:border-border-strong shadow-xs",
  // Ação discreta (Cancelar, Voltar, links de ação)
  ghost: "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
  // Ação destrutiva confirmada (Excluir, Recusar)
  danger: "bg-danger-text text-white hover:bg-danger-text/90 shadow-xs",
  // Confirmação positiva (Aprovar, Finalizar)
  success: "bg-success-text text-white hover:bg-success-text/90 shadow-xs",
};

const sizeClasses: Record<ControlSize, string> = {
  sm: "px-3 gap-1.5",
  md: "px-4 gap-2",
};

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ControlSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  // Mostra o indicador de carregamento no lugar do ícone e desabilita o botão
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Botão padrão do sistema. Mesma altura dos inputs (sm = 32px, md = 40px).
 * `type` é "button" por padrão: botão de envio de formulário precisa de `type="submit"`.
 * `className` serve só para layout (margem, flex); aparência vem de `variant` e `size`.
 */
export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  fullWidth = false,
  type = "button",
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const iconSize = controlIconSize[size];

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center shrink-0 rounded-lg font-semibold whitespace-nowrap select-none",
        "transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200",
        controlHeight[size],
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 size={iconSize} className="animate-spin" /> : Icon && <Icon size={iconSize} />}
      {children}
      {IconRight && !loading && <IconRight size={iconSize} />}
    </button>
  );
}
