import { Building2, Plus } from "lucide-react";
import { Button } from "../../components/ui";

type TenantHeaderProps = {
  canManageOrganization: boolean;
  onAdd: () => void;
};

export default function TenantHeader({
  canManageOrganization,
  onAdd,
}: TenantHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
          <Building2 size={18} className="text-text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-text-primary truncate">Organizações</h1>
          <p className="text-text-secondary text-xs mt-0.5">
            Organizações cadastradas na plataforma
          </p>
        </div>
      </div>
      {canManageOrganization && (
        <Button icon={Plus} onClick={onAdd}>
          Nova Organização
        </Button>
      )}
    </div>
  );
}
