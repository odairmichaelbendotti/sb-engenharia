import type { ComponentProps } from "react";
import { cx } from "../../utils/cx";
import { useFieldContext } from "./field-context";
import { controlClasses } from "./control";

interface TextareaProps extends ComponentProps<"textarea"> {
  invalid?: boolean;
}

// Texto longo com a mesma borda, fonte e foco do Input. A altura vem de `rows` (padrão 3)
export function Textarea({ invalid, className, id, rows = 3, ...props }: TextareaProps) {
  const field = useFieldContext();

  return (
    <textarea
      id={id ?? field?.id}
      rows={rows}
      aria-invalid={invalid ?? field?.invalid ?? undefined}
      className={cx(
        controlClasses(invalid ?? field?.invalid ?? false),
        "block px-3 py-2.5 text-sm leading-relaxed resize-y",
        className,
      )}
      {...props}
    />
  );
}
