import type { ComponentProps, KeyboardEvent, ReactNode } from "react";
import { cx } from "../../utils/cx";

interface TableProps {
  // Menos espaçamento e largura pelo conteúdo, para painéis e modais estreitos
  compact?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Tabela padrão. Nunca rola na horizontal: layout fixo, as colunas de dado têm largura
 * (`width` do Th) e a primeira coluna fica com a sobra. Colunas secundárias somem em telas
 * menores (`className="hidden lg:table-cell"` no Th e no Td).
 * Alinhamento vem da posição (regras `.data-table` no index.css): primeira à esquerda,
 * do meio centralizadas, última coluna de dado à direita. Não alinhar célula à mão.
 */
export function Table({ compact = false, className, children }: TableProps) {
  return <table className={cx("data-table", compact && "data-table-compact", className)}>{children}</table>;
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

// Rodapé de totais (linhas `Tr` com `Td`), com divisória e peso de fonte padrão
export function TableFoot({ children }: { children: ReactNode }) {
  return <tfoot>{children}</tfoot>;
}

interface TrProps extends ComponentProps<"tr"> {
  // Linha que abre a visualização do registro: clique e Enter/Espaço chamam `onOpen`
  onOpen?: () => void;
  // Registro inativo (cancelado): linha esmaecida
  muted?: boolean;
}

// Linha do corpo; com `onOpen` (ou `onClick`) a linha inteira fica clicável e focável
export function Tr({ className, onClick, onOpen, muted = false, ...props }: TrProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (!onOpen || e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <tr
      className={cx(
        (onClick || onOpen) && "cursor-pointer",
        onOpen && "focus-visible:outline-none focus-visible:bg-surface-muted",
        muted && "opacity-60",
        className,
      )}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onClick ?? onOpen}
      onKeyDown={onOpen ? handleKeyDown : undefined}
      {...props}
    />
  );
}

interface ThProps {
  // Largura da coluna (classe do Tailwind, ex.: "w-36"). A primeira coluna não leva: fica com a sobra
  width?: string;
  // Só para visibilidade responsiva (ex.: "hidden md:table-cell"), nunca alinhamento
  className?: string;
  // Coluna do menu de ações (⋯): estreita, e a coluna anterior passa a alinhar à direita
  actions?: boolean;
  children?: ReactNode;
}

export function Th({ width, actions = false, className, children }: ThProps) {
  return (
    <th className={cx(actions ? "cell-actions w-12" : width, className)}>
      {actions ? <span className="sr-only">Ações</span> : children}
    </th>
  );
}

interface TdProps {
  // Só para visibilidade responsiva (ex.: "hidden md:table-cell"), nunca alinhamento
  className?: string;
  // Faixa à esquerda na cor do contrato (só na primeira coluna): agrupa as linhas pelo olhar
  accent?: string | null;
  // Célula do menu de ações (⋯): o clique não abre a linha
  actions?: boolean;
  children?: ReactNode;
}

export function Td({ className, accent, actions = false, children }: TdProps) {
  return (
    <td
      className={cx(actions && "cell-actions", className)}
      onClick={actions ? (e) => e.stopPropagation() : undefined}
      onKeyDown={actions ? (e) => e.stopPropagation() : undefined}
    >
      {accent && (
        <span
          aria-hidden
          className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full"
          style={{ backgroundColor: accent }}
        />
      )}
      {/* Bloco em linha limitado à célula: o conteúdo segue o alinhamento da coluna e trunca.
          Na primeira coluna (identidade) vira bloco de largura total, para o título truncar */}
      <div className="cell-inner inline-block align-middle max-w-full min-w-0">{children}</div>
    </td>
  );
}
