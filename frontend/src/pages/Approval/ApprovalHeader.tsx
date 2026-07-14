import { UserCheck } from "lucide-react";

export default function ApprovalHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <UserCheck size={20} className="text-primary-500" />
          Aprovações
        </h1>
        <p className="text-text-secondary text-xs mt-0.5">
          Solicitações de acesso de novos usuários aguardando liberação
        </p>
      </div>
    </div>
  );
}
