import { X } from "lucide-react";
import type { FilterChip } from "./scope-options";

interface FilterSummaryProps {
  count: number;
  searchTerm?: string;
  // Filtros ativos como etiquetas removíveis (empresa, contrato, empenho...)
  chips?: FilterChip[];
  // Outros filtros ativos, já em texto (ex.: "vencidas")
  extra?: string | undefined;
  onClear: () => void;
}

// Linha "N resultados ... [etiquetas] · Limpar filtros", igual nas listagens; só aparece com filtro ativo
export function FilterSummary({ count, searchTerm, chips = [], extra, onClear }: FilterSummaryProps) {
  if (!searchTerm && chips.length === 0 && !extra) return null;

  return (
    <div className="flex items-center gap-x-2 gap-y-1.5 flex-wrap text-xs text-text-muted">
      <span>
        {count} resultado{count !== 1 ? "s" : ""}
        {extra && <> {extra}</>}
        {searchTerm && <> para "{searchTerm}"</>}
      </span>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-surface-muted border border-border font-medium text-text-primary"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            title="Remover filtro"
            aria-label="Remover filtro"
            className="p-0.5 rounded-sm text-text-muted hover:bg-border hover:text-text-primary cursor-pointer transition-colors"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="font-semibold text-text-primary hover:underline underline-offset-2 cursor-pointer"
      >
        Limpar filtros
      </button>
    </div>
  );
}
