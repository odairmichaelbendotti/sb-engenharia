import { createContext, useContext, useId, useRef, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";
import { cx } from "../../utils/cx";
import { IconButton } from "./IconButton";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-5xl",
};

// Id do título, para o diálogo ser anunciado pelo nome (aria-labelledby)
const ModalTitleContext = createContext<string | undefined>(undefined);

interface ModalProps {
  open: boolean;
  // Acima do mapa (Leaflet vai até z-1000) e de painéis laterais; padrão z-50
  elevated?: boolean;
  size?: ModalSize;
  // Fechar: chamado ao clicar fora do painel (regra de todos os modais do sistema)
  onClose: () => void;
  className?: string;
  children: ReactNode;
}

/**
 * Casca padrão de modal: fundo escurecido, painel centralizado em coluna (`flex flex-col`)
 * com altura máxima de 90% da tela. Clicar fora fecha (`onClose`).
 * Conteúdo: ModalHeader, ModalBody (ou StepForm) e ModalFooter.
 */
export function Modal({ open, size = "md", elevated = false, onClose, className, children }: ModalProps) {
  const titleId = useId();
  // Só fecha se o clique começou e terminou no fundo: arrastar uma seleção de texto
  // de dentro do formulário para fora não fecha o modal sem querer
  const pressedOnBackdrop = useRef(false);
  if (!open) return null;

  return (
    <div
      className={cx(
        "fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]",
        elevated ? "z-1300" : "z-50",
      )}
      onMouseDown={(e) => {
        pressedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        // Modal pode estar dentro de uma linha clicável: o clique não sobe para ela
        e.stopPropagation();
        if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose();
        pressedOnBackdrop.current = false;
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className={cx(
          "w-full max-h-[90vh] flex flex-col bg-surface rounded-xl border border-border shadow-2xl animate-row-in",
          sizeClasses[size],
          className,
        )}
      >
        <ModalTitleContext.Provider value={titleId}>{children}</ModalTitleContext.Provider>
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  onClose?: () => void;
  // Elementos extras ao lado do título (etiquetas, status)
  children?: ReactNode;
}

export function ModalHeader({ title, description, icon: Icon, onClose, children }: ModalHeaderProps) {
  const titleId = useContext(ModalTitleContext);

  return (
    <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0">
            <Icon size={18} className="text-text-primary" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-text-primary truncate">
              {title}
            </h2>
            {children}
          </div>
          {description && <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{description}</p>}
        </div>
      </div>
      {onClose && <IconButton icon={X} label="Fechar" size="sm" onClick={onClose} />}
    </div>
  );
}

export function ModalBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("flex-1 min-h-0 overflow-y-auto p-5", className)}>{children}</div>;
}

export function ModalFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cx(
        "shrink-0 flex flex-wrap items-center justify-end gap-2 px-5 py-4 border-t border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}
