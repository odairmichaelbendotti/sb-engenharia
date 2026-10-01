import { EmpenhoFilterSelect } from "../../components/filters/EmpenhoFilterSelect";
import type { EmpenhoFilterOption } from "../../components/filters/empenho-options";
import { SearchInput } from "../../components/filters/SearchInput";

interface InvoiceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  empenhoOptions: EmpenhoFilterOption[];
  empenhoId: string;
  onEmpenhoChange: (value: string) => void;
}

export function InvoiceFilters({
  searchTerm,
  onSearchChange,
  empenhoOptions,
  empenhoId,
  onEmpenhoChange,
}: InvoiceFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <SearchInput
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Buscar por número, empresa, descrição, OS ou obra..."
      />
      <EmpenhoFilterSelect options={empenhoOptions} value={empenhoId} onChange={onEmpenhoChange} />
    </div>
  );
}
