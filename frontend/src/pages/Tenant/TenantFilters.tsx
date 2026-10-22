import { SearchInput } from "../../components/filters/SearchInput";

type TenantFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

export default function TenantFilters({
  searchTerm,
  onSearchChange,
}: TenantFiltersProps) {
  return (
    <SearchInput
      value={searchTerm}
      onChange={onSearchChange}
      placeholder="Buscar por nome, apelido, CNPJ ou cidade..."
    />
  );
}
