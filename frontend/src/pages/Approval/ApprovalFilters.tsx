import { Search } from "lucide-react";
import { Input } from "../../components/ui";

type ApprovalFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

export default function ApprovalFilters({
  searchTerm,
  onSearchChange,
}: ApprovalFiltersProps) {
  return (
    <Input
      type="text"
      size="sm"
      icon={Search}
      placeholder="Buscar por nome ou e-mail..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
    />
  );
}
