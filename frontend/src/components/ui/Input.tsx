import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "../../utils/cx";
import { useFieldContext } from "./field-context";
import { controlClasses, controlHeight, controlIconSize, type ControlSize } from "./control";

interface InputProps extends Omit<ComponentProps<"input">, "size" | "prefix"> {
  size?: ControlSize;
  // Ícone à esquerda (decorativo)
  icon?: LucideIcon;
  // Texto curto à esquerda, como "R$"
  prefix?: ReactNode;
  // Texto curto ou elemento à direita, como "dias" ou "%"
  suffix?: ReactNode;
  invalid?: boolean;
}

/**
 * Campo de texto padrão do sistema. Altura fixa por `size` (sm = 32px, md = 40px).
 * `className` vai no contêiner e serve só para layout (largura, margem).
 */
export function Input({
  size = "md",
  icon: Icon,
  prefix,
  suffix,
  invalid,
  className,
  id,
  ...props
}: InputProps) {
  const field = useFieldContext();
  const hasStart = Boolean(Icon || prefix);

  return (
    <div className={cx("relative", className)}>
      {Icon && (
        <Icon
          size={controlIconSize[size]}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
      )}
      {!Icon && prefix && (
        <span
          className={cx(
            "absolute top-1/2 -translate-y-1/2 text-text-muted font-medium pointer-events-none",
            size === "sm" ? "left-2.5 text-xs" : "left-3",
          )}
        >
          {prefix}
        </span>
      )}
      <input
        id={id ?? field?.id}
        aria-invalid={invalid ?? field?.invalid ?? undefined}
        className={cx(
          controlClasses(invalid ?? field?.invalid ?? false),
          controlHeight[size],
          hasStart ? (size === "sm" ? "pl-8" : "pl-10") : size === "sm" ? "pl-2.5" : "pl-3",
          suffix ? "pr-12" : size === "sm" ? "pr-2.5" : "pr-3",
        )}
        {...props}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs font-medium">
          {suffix}
        </span>
      )}
    </div>
  );
}
