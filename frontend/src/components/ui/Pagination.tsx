import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "./IconButton";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  totalItems: number;
  itemsPerPage: number;
  // Nome dos itens no plural, para "Mostrando 1 a 10 de 42 empenhos"
  itemLabel: string;
  onPageChange: (page: number) => void;
}

// Rodapé de paginação das tabelas. Some quando há uma página só
export function Pagination({
  currentPage,
  totalPages,
  startIndex,
  totalItems,
  itemsPerPage,
  itemLabel,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-border bg-surface-muted">
      <p className="text-xs text-text-secondary">
        Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <IconButton
          icon={ChevronLeft}
          label="Página anterior"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        />
        <span className="text-xs font-medium text-text-secondary tabular-nums px-1">
          {currentPage} / {totalPages}
        </span>
        <IconButton
          icon={ChevronRight}
          label="Próxima página"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        />
      </div>
    </div>
  );
}
