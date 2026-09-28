import { ArrowDownUp, FileSignature, Search } from "lucide-react";

export type OrdemServicoSort = "URGENCY" | "NUMERO" | "VALOR";

const SORT_LABEL: Record<OrdemServicoSort, string> = {
  URGENCY: "Prazo (mais urgentes)",
  NUMERO: "Número (mais recentes)",
  VALOR: "Valor (maior)",
};

export type EmpenhoFilterOption = {
  id: string;
  numero: string;
  companyName: string;
  count: number;
};

interface OrdemServicoFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sort: OrdemServicoSort;
  onSortChange: (value: OrdemServicoSort) => void;
  empenhoOptions: EmpenhoFilterOption[];
  empenhoId: string;
  onEmpenhoChange: (value: string) => void;
}

export function OrdemServicoFilters({
  searchTerm,
  onSearchChange,
  sort,
  onSortChange,
  empenhoOptions,
  empenhoId,
  onEmpenhoChange,
}: OrdemServicoFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar por OS, empenho, contrato, empresa ou obra..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
        />
      </div>
      <label className="relative sm:w-64">
        <span className="sr-only">Filtrar por empenho</span>
        <FileSignature
          size={14}
          className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
            empenhoId ? "text-primary-500" : "text-text-muted"
          }`}
        />
        <select
          value={empenhoId}
          onChange={(e) => onEmpenhoChange(e.target.value)}
          className={`w-full pl-8 pr-3 py-2 border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 cursor-pointer ${
            empenhoId ? "border-primary-300 text-text-primary font-medium" : "border-border text-text-primary"
          }`}
        >
          <option value="">Todos os empenhos</option>
          {empenhoOptions.map((empenho) => (
            <option key={empenho.id} value={empenho.id}>
              {empenho.numero} · {empenho.companyName} ({empenho.count})
            </option>
          ))}
        </select>
      </label>
      <label className="relative sm:w-56">
        <span className="sr-only">Ordenar por</span>
        <ArrowDownUp
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as OrdemServicoSort)}
          className="w-full pl-8 pr-3 py-2 border border-border rounded-lg bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 cursor-pointer"
        >
          {(Object.keys(SORT_LABEL) as OrdemServicoSort[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABEL[key]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
