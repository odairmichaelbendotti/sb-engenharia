import { EmpenhoFilterSelect } from "../../components/filters/EmpenhoFilterSelect";
import type { EmpenhoFilterOption } from "../../components/filters/empenho-options";
import { SearchInput } from "../../components/filters/SearchInput";

interface ObraFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  empenhoOptions: EmpenhoFilterOption[];
  empenhoId: string;
  onEmpenhoChange: (value: string) => void;
}

export function ObraFilters({ search, onSearchChange, empenhoOptions, empenhoId, onEmpenhoChange }: ObraFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Buscar por obra, patrimônio, OS, empenho, tipo ou responsável..."
      />
      <EmpenhoFilterSelect options={empenhoOptions} value={empenhoId} onChange={onEmpenhoChange} />
    </div>
  );
}
