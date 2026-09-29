import { BookOpen, Users } from "lucide-react";

type UsersHeaderProps = {
  // Presente só para quem pode mudar perfis — abre a cola de perfis
  onOpenGuide?: () => void;
};

export default function UsersHeader({ onOpenGuide }: UsersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Users size={20} className="text-primary-500" />
          Usuários
        </h1>
        <p className="text-text-secondary text-xs mt-0.5">
          Usuários cadastrados no sistema
        </p>
      </div>
      {onOpenGuide && (
        <button
          type="button"
          onClick={onOpenGuide}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 border border-primary-200 bg-primary-50 hover:bg-primary-100 rounded-md cursor-pointer transition-colors"
        >
          <BookOpen size={16} />
          O que cada perfil pode fazer
        </button>
      )}
    </div>
  );
}
