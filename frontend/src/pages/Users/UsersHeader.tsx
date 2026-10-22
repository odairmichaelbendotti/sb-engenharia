import { BookOpen, Users } from "lucide-react";
import { Button } from "../../components/ui";

type UsersHeaderProps = {
  // Presente só para quem pode mudar perfis — abre a cola de perfis
  onOpenGuide?: () => void;
};

export default function UsersHeader({ onOpenGuide }: UsersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
          <Users size={18} className="text-text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-text-primary">Usuários</h1>
          <p className="text-text-secondary text-xs">Usuários cadastrados no sistema</p>
        </div>
      </div>
      {onOpenGuide && (
        <Button variant="secondary" icon={BookOpen} onClick={onOpenGuide}>
          O que cada perfil pode fazer
        </Button>
      )}
    </div>
  );
}
