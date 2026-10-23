import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { cx } from "../../utils/cx";
import { IconButton } from "./IconButton";

export type ActionMenuItem = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  // Ação destrutiva: vermelha e separada das outras por uma linha
  danger?: boolean;
  // Some do menu (ex.: sem permissão)
  hidden?: boolean;
};

const MENU_WIDTH = 184;
const ITEM_HEIGHT = 34;

interface ActionMenuProps {
  items: ActionMenuItem[];
  // Nome do botão para leitor de tela (ex.: "Ações da obra")
  label?: string;
}

/**
 * Menu de ações da linha (⋯): Visualizar, Editar, ações da entidade e, separado, Excluir.
 * Abre num portal com posição fixa, para não ser cortado pelo card nem pela tabela,
 * e vira para cima quando não cabe abaixo do botão.
 */
export function ActionMenu({ items, label = "Ações" }: ActionMenuProps) {
  const visible = items.filter((item) => !item.hidden);
  const regular = visible.filter((item) => !item.danger);
  const danger = visible.filter((item) => item.danger);
  const [position, setPosition] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = position !== null;

  function toggle() {
    if (open) return setPosition(null);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const height = visible.length * ITEM_HEIGHT + (danger.length && regular.length ? 9 : 0) + 12;
    const right = Math.max(8, window.innerWidth - rect.right);
    setPosition(
      rect.bottom + height + 8 > window.innerHeight
        ? { bottom: window.innerHeight - rect.top + 4, right }
        : { top: rect.bottom + 4, right },
    );
  }

  // Foco no primeiro item ao abrir, para navegar pelo teclado
  useLayoutEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setPosition(null);
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    }
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Fecha só o menu, não o modal por baixo
      e.stopImmediatePropagation();
      close();
      buttonRef.current?.focus();
    }
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  if (visible.length === 0) return null;

  function run(item: ActionMenuItem) {
    setPosition(null);
    item.onClick();
  }

  // Setas para cima/baixo percorrem os itens
  function onMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const buttons = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "ArrowDown" ? (index + 1) % buttons.length : (index - 1 + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }

  const renderItem = (item: ActionMenuItem) => (
    <button
      key={item.label}
      type="button"
      role="menuitem"
      onClick={(e) => {
        e.stopPropagation();
        run(item);
      }}
      className={cx(
        "w-full flex items-center gap-2.5 h-8 px-2.5 rounded-md text-sm text-left cursor-pointer transition-colors",
        "focus-visible:outline-none",
        item.danger
          ? "text-danger-text hover:bg-danger-bg focus-visible:bg-danger-bg"
          : "text-text-primary hover:bg-surface-muted focus-visible:bg-surface-muted",
      )}
    >
      <item.icon size={14} className="shrink-0" />
      {item.label}
    </button>
  );

  return (
    <>
      <IconButton
        ref={buttonRef}
        icon={MoreHorizontal}
        label={label}
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className={open ? "bg-surface-muted text-text-primary" : undefined}
      />
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{ ...position, width: MENU_WIDTH }}
            className="fixed z-1400 rounded-xl border border-border bg-surface shadow-lg p-1.5 animate-row-in"
          >
            {regular.map(renderItem)}
            {regular.length > 0 && danger.length > 0 && <div className="my-1 mx-1.5 border-t border-border" />}
            {danger.map(renderItem)}
          </div>,
          document.body,
        )}
    </>
  );
}
