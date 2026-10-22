import { UserCheck } from "lucide-react";

export default function ApprovalHeader() {
  return (
    <div className="flex items-center gap-2.5 min-w-0 mb-4">
      <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
        <UserCheck size={18} className="text-text-primary" />
      </div>
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-text-primary">Aprovações</h1>
        <p className="text-text-secondary text-xs">Solicitações de acesso de novos usuários aguardando liberação</p>
      </div>
    </div>
  );
}
