import { Building2 } from "lucide-react";
import type { TenantOption } from "../../../types/tenant";
import { Select } from "../../components/ui";

type TenantSelectProps = {
  tenants: TenantOption[];
  value: string;
  onChange: (tenantId: string) => void;
  placeholder?: string;
};

// Lista de organizações sobre o Select padrão; a primeira opção faz o papel do placeholder
const TenantSelect = ({
  tenants,
  value,
  onChange,
  placeholder = "Selecione sua organização",
}: TenantSelectProps) => {
  return (
    <Select icon={Building2} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>
        {tenants.length === 0 ? "Nenhuma organização disponível" : placeholder}
      </option>
      {tenants.map((tenant) => (
        <option key={tenant.id} value={tenant.id}>
          {tenant.name}
        </option>
      ))}
    </Select>
  );
};

export default TenantSelect;
