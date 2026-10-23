import { BookOpen, Users } from "lucide-react";
import { Button } from "../../components/ui";
import { PageHeader } from "../../components/PageHeader";

type UsersHeaderProps = {
  // Presente só para quem pode mudar perfis — abre a cola de perfis
  onOpenGuide?: () => void;
};

export default function UsersHeader({ onOpenGuide }: UsersHeaderProps) {
  return (
    <PageHeader
      icon={Users}
      title="Usuários"
      description="Gestão · usuários cadastrados no sistema"
      actions={
        onOpenGuide && (
          <Button variant="secondary" icon={BookOpen} onClick={onOpenGuide}>
            O que cada perfil pode fazer
          </Button>
        )
      }
    />
  );
}
