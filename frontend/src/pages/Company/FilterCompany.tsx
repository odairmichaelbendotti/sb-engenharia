import { SearchInput } from "../../components/filters/SearchInput";

type FilterCompanyProps = {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
};

const FilterCompany = ({ searchTerm, setSearchTerm }: FilterCompanyProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por nome, CNPJ ou cidade..."
      />
    </div>
  );
};

export default FilterCompany;
