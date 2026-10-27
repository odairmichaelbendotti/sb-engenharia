import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import { cx } from "../../utils/cx";
import { Input } from "./Input";
import { controlHeight, type ControlSize } from "./control";

interface InlineEditProps extends Omit<ComponentProps<typeof Input>, "value" | "size"> {
  value: string;
  size?: ControlSize;
  // O que aparece fora da edição (padrão: o próprio valor, com o prefixo)
  display?: ReactNode;
  align?: "left" | "right";
  // Campo opcional: vazio fica fechado (mostra o `display`) em vez de aberto com o placeholder
  optional?: boolean;
  // Esc desfaz: devolve o valor de quando a edição começou
  onRevert?: (original: string) => void;
}

/**
 * Valor que vira campo só ao ser editado: fora da edição mostra o texto, e um clique (ou o foco
 * pelo Tab) abre o Input. Fecha no blur ou no Enter; Esc desfaz e fecha. Fica aberto enquanto
 * está vazio (linha nova, com o placeholder; o opcional não) ou inválido. Desabilitado, mostra só o texto.
 */
export function InlineEdit({
  value,
  size = "md",
  display,
  align = "left",
  optional = false,
  onRevert,
  invalid,
  disabled,
  prefix,
  className,
  title,
  onBlur,
  onKeyDown,
  ...props
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const original = useRef(value);
  const input = useRef<HTMLInputElement>(null);
  const aberto = !disabled && (editing || (!value && !optional) || Boolean(invalid));

  // Abriu por clique ou Tab: o foco vai para o campo, com o texto selecionado
  useEffect(() => {
    if (!editing) return;
    input.current?.focus();
    input.current?.select();
  }, [editing]);

  function abrir() {
    original.current = value;
    setEditing(true);
  }

  if (aberto) {
    return (
      <Input
        ref={input}
        size={size}
        value={value}
        invalid={invalid}
        prefix={prefix}
        title={title}
        className={className}
        onFocus={() => {
          if (!editing) original.current = value;
        }}
        onBlur={(event) => {
          setEditing(false);
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          } else if (event.key === "Escape") {
            // Não deixa o Esc fechar o modal ou a tela por baixo
            event.preventDefault();
            event.stopPropagation();
            onRevert?.(original.current);
            event.currentTarget.blur();
          }
        }}
        {...props}
      />
    );
  }

  const texto = display ?? (
    <>
      {prefix && <span className="text-text-muted">{prefix} </span>}
      {value}
    </>
  );

  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      aria-label={props["aria-label"]}
      className={cx(
        "group flex items-center gap-1 w-full min-w-0 rounded-lg border border-transparent px-2.5",
        "text-text-primary tabular-nums cursor-pointer hover:bg-surface-muted hover:border-border",
        "disabled:cursor-default disabled:text-text-secondary disabled:hover:bg-transparent disabled:hover:border-transparent",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-100",
        controlHeight[size],
        align === "right" ? "justify-end text-right" : "justify-start text-left",
        className,
      )}
      onClick={abrir}
      onFocus={abrir}
    >
      {!disabled && align === "right" && (
        <Pencil
          size={11}
          className="shrink-0 text-text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      )}
      <span className="truncate">{texto}</span>
      {!disabled && align === "left" && (
        <Pencil
          size={11}
          className="ml-auto shrink-0 text-text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      )}
    </button>
  );
}
