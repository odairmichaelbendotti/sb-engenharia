import { Search, Filter, X } from "lucide-react";
import type { ObraStatus, ObraTipo } from "../../../types/obra";
export interface ObraFiltersState {
  search: string;
  status: ObraStatus | "";
  tipo: ObraTipo | "";
}
interface ObraFiltersProps {
  filters: ObraFiltersState;
  onChange: (f: ObraFiltersState) => void;
  total: number;
  filtered: number;
}
const STATUS_OPTIONS: { value: ObraStatus | ""; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "EM_ANDAMENTO", label: "Em Andamento" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "PARALISADA", label: "Paralisada" },
  { value: "CANCELADA", label: "Cancelada" },
];
const TIPO_OPTIONS: { value: ObraTipo | ""; label: string }[] = [
  { value: "", label: "Todos os tipos" },
  { value: "CONSTRUCAO", label: "Construção" },
  { value: "REFORMA", label: "Reforma" },
  { value: "AMPLIACAO", label: "Ampliação" },
  { value: "PAVIMENTACAO", label: "Pavimentação" },
  { value: "SANEAMENTO", label: "Saneamento" },
  { value: "OUTRO", label: "Outro" },
];
const selectClass =
  "pl-3 pr-8 py-2 border border-border rounded-lg bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all appearance-none cursor-pointer";
export function ObraFilters({
  filters,
  onChange,
  total,
  filtered,
}: ObraFiltersProps) {
  const hasFilters = filters.search || filters.status || filters.tipo;
  function clearAll() {
    onChange({ search: "", status: "", tipo: "" });
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Buscar por nome, código ou responsável..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
          />
        </div>
        {/* Status filter */}
        <div className="relative">
          <Filter
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({
                ...filters,
                status: e.target.value as ObraStatus | "",
              })
            }
            className={`${selectClass} pl-9`}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {/* Tipo filter */}
        <div className="relative">
          <select
            value={filters.tipo}
            onChange={(e) =>
              onChange({ ...filters, tipo: e.target.value as ObraTipo | "" })
            }
            className={selectClass}
          >
            {TIPO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-secondary hover:text-danger-text hover:bg-danger-bg border border-border rounded-lg transition-colors cursor-pointer"
          >
            <X size={14} />
            Limpar
          </button>
        )}
      </div>
      {hasFilters && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Exibindo{" "}
            <span className="font-semibold text-text-secondary">
              {filtered}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-text-secondary">{total}</span>{" "}
            obras
          </p>
          {filters.search && (
            <p className="text-xs text-text-muted">
              Buscando por: <b>{filters.search}</b>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
