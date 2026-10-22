import type { ComponentProps, ReactNode } from "react";
import { cx } from "../../utils/cx";

interface TableProps {
  // Menos espaçamento, para painéis e modais estreitos
  compact?: boolean;
  // Largura mínima antes de rolar na horizontal (ex.: "min-w-[620px]")
  className?: string;
  children: ReactNode;
}

/**
 * Tabela padrão. O alinhamento vem da posição da coluna (regras `.data-table` no index.css):
 * primeira à esquerda, última à direita, as do meio centralizadas. Não alinhar célula à mão.
 * Largura: cada coluna ocupa o que o conteúdo pede e a sobra se divide entre todas.
 */
export function Table({ compact = false, className, children }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cx("data-table", compact && "data-table-compact", className)}>{children}</table>
    </div>
  );
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

// Linha do corpo; `onClick` deixa a linha inteira clicável
export function Tr({ className, onClick, ...props }: ComponentProps<"tr">) {
  return <tr className={cx(onClick && "cursor-pointer", className)} onClick={onClick} {...props} />;
}

interface CellProps {
  // Coluna de texto longo (descrição): quebra linha até uma largura máxima, sem tomar o espaço das outras
  wrap?: boolean;
  // Só para visibilidade responsiva (ex.: "hidden md:table-cell"), nunca alinhamento
  className?: string;
  children?: ReactNode;
}

export function Th({ wrap = false, className, children }: CellProps) {
  return <th className={cx(wrap && "cell-wrap", className)}>{children}</th>;
}

export function Td({ wrap = false, className, children }: CellProps) {
  return (
    <td className={cx(wrap && "cell-wrap", className)}>
      {/* Bloco em linha: o conteúdo (mesmo um flex) segue o alinhamento da coluna */}
      <div className={cx("inline-block align-middle", wrap ? "min-w-40 max-w-88" : "max-w-full")}>{children}</div>
    </td>
  );
}
