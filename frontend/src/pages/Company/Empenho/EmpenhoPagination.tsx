import { ChevronLeft, ChevronRight } from "lucide-react";

interface EmpenhoPaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function EmpenhoPagination({
  currentPage,
  totalPages,
  startIndex,
  totalItems,
  itemsPerPage,
  onPageChange,
}: EmpenhoPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted">
      <p className="text-sm text-text-secondary">
        Mostrando {startIndex + 1} a{" "}
        {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems}{" "}
        empenhos
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm text-text-secondary">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
