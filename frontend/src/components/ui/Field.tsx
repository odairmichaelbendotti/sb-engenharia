import { useId, type ReactNode } from "react";
import { cx } from "../../utils/cx";
import { FieldContext } from "./field-context";

interface FieldProps {
  label?: ReactNode;
  required?: boolean;
  // Texto de apoio abaixo do controle; some quando há erro
  hint?: ReactNode;
  error?: ReactNode;
  // Ação discreta alinhada à direita do rótulo (ex.: "Buscar CEP")
  action?: ReactNode;
  // Rótulo de um grupo (botões, checkboxes) em vez de um controle só: vira role="group"
  group?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Rótulo + controle + texto de apoio, com o mesmo espaçamento em todos os formulários.
 * O rótulo fica ligado ao controle filho automaticamente (via contexto), sem precisar de id.
 */
export function Field({ label, required, hint, error, action, group = false, className, children }: FieldProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const LabelTag = group ? "span" : "label";

  return (
    <FieldContext.Provider value={{ id, invalid: Boolean(error) }}>
      <div
        className={cx("min-w-0", className)}
        role={group ? "group" : undefined}
        aria-labelledby={group && label ? labelId : undefined}
      >
        {(label || action) && (
          <div className="flex items-center justify-between gap-2 mb-1.5">
            {label && (
              <LabelTag
                id={labelId}
                htmlFor={group ? undefined : id}
                className="text-xs font-semibold text-text-secondary"
              >
                {label}
                {required && <span className="ml-0.5 text-danger-text">*</span>}
              </LabelTag>
            )}
            {action}
          </div>
        )}
        {children}
        {error ? (
          <p className="mt-1.5 text-xs text-danger-text">{error}</p>
        ) : (
          hint && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>
        )}
      </div>
    </FieldContext.Provider>
  );
}
