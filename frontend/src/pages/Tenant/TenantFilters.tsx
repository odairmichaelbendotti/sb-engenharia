import { Search } from "lucide-react";

type TenantFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

export default function TenantFilters({
  searchTerm,
  onSearchChange,
}: TenantFiltersProps) {
  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="text"
        placeholder="Buscar por nome, apelido, CNPJ ou cidade..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
      />
    </div>
  );
}
