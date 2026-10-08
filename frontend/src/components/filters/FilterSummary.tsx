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
          className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            title="Remover filtro"
            className="p-0.5 rounded-full hover:bg-primary-100 cursor-pointer"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <button onClick={onClear} className="text-primary-500 hover:text-primary-600 font-medium cursor-pointer">
        Limpar filtros
      </button>
    </div>
  );
}
