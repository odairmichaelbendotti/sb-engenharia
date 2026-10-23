import { Building2 } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";

type TenantHeaderProps = {
  canManageOrganization: boolean;
  onAdd: () => void;
};

export default function TenantHeader({ canManageOrganization, onAdd }: TenantHeaderProps) {
  return (
    <PageHeader
      icon={Building2}
      title="Organizações"
      description="Plataforma · organizações cadastradas"
      canAct={canManageOrganization}
      actionLabel="Nova Organização"
      onAction={onAdd}
    />
  );
}
