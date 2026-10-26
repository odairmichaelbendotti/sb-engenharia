import { AlertTriangle, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { Button } from "../../components/ui";

// Carregando ou erro ao abrir a OS nas telas de trabalho
export function WorkspaceState({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  if (!error) {
    return (
      <div className="py-16 text-center">
        <Loader2 size={28} className="mx-auto text-text-muted animate-spin mb-2" />
        <p className="text-text-secondary text-sm">Carregando orçamento da OS...</p>
      </div>
    );
  }
  return (
    <div className="py-16 text-center">
      <AlertTriangle size={28} className="mx-auto text-text-muted mb-2" />
      <p className="text-sm text-text-secondary font-medium">{error}</p>
      <div className="mt-4 flex justify-center gap-2">
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Tentar de novo
        </Button>
        <Link to="/medicoes" className="inline-flex items-center h-8 px-3 text-xs font-medium text-text-secondary hover:text-text-primary">
          Voltar para Medições
        </Link>
      </div>
    </div>
  );
}
