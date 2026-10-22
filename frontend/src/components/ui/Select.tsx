import type { ComponentProps } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cx } from "../../utils/cx";
import { useFieldContext } from "./field-context";
import { controlClasses, controlHeight, controlIconSize, type ControlSize } from "./control";

interface SelectProps extends Omit<ComponentProps<"select">, "size"> {
  size?: ControlSize;
  // Ícone à esquerda (decorativo)
  icon?: LucideIcon;
  invalid?: boolean;
}

/**
 * Lista de opções padrão do sistema (select nativo com a mesma aparência do Input).
 * As opções vão como filhos (`<option>`). `className` vai no contêiner, só para layout.
 */
export function Select({ size = "md", icon: Icon, invalid, className, id, children, ...props }: SelectProps) {
  const field = useFieldContext();
  const iconSize = controlIconSize[size];

  return (
    <div className={cx("relative", className)}>
      {Icon && (
        <Icon
          size={iconSize}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
      )}
      <select
        id={id ?? field?.id}
        aria-invalid={invalid ?? field?.invalid ?? undefined}
        className={cx(
          controlClasses(invalid ?? field?.invalid ?? false),
          controlHeight[size],
          "appearance-none cursor-pointer truncate",
          Icon ? (size === "sm" ? "pl-8" : "pl-10") : size === "sm" ? "pl-2.5" : "pl-3",
          size === "sm" ? "pr-8" : "pr-9",
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={iconSize}
        className={cx(
          "absolute top-1/2 -translate-y-1/2 text-text-muted pointer-events-none",
          size === "sm" ? "right-2.5" : "right-3",
        )}
      />
    </div>
  );
}
