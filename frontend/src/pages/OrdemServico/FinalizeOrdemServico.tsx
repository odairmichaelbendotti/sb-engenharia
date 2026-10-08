import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { OrdemServico } from "../../../types/ordem-servico";
import { useOrdensServico } from "../../store/ordensServico";

function useFinalizeOrdemServico(os: OrdemServico) {
  const updateStatus = useOrdensServico((s) => s.updateOrdemServicoStatus);
  const [loading, setLoading] = useState(false);

  const finalize = async () => {
    setLoading(true);
    try {
      await updateStatus(os.id, "FINALIZADO");
      toast.success(`OS ${os.numero} finalizada`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao finalizar a ordem de serviço");
      setLoading(false);
    }
  };

  return { finalize, loading };
}

// Os cliques não podem chegar à linha, que abre o painel da OS
const stop = (e: React.SyntheticEvent) => e.stopPropagation();

// Botão da linha: pede confirmação no próprio lugar antes de finalizar
export function FinalizeOrdemServicoButton({ ordemServico }: { ordemServico: OrdemServico }) {
  const { finalize, loading } = useFinalizeOrdemServico(ordemServico);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          setConfirming(true);
        }}
        onKeyDown={stop}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary-500 hover:bg-secondary-600 text-white text-xs font-semibold cursor-pointer transition-colors"
      >
        <CheckCircle2 size={13} />
        Finalizar OS
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5" onClick={stop} onKeyDown={stop}>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={loading}
        className="px-2.5 py-1.5 rounded-md border border-border bg-surface text-text-secondary hover:bg-surface-muted text-xs font-medium cursor-pointer transition-colors disabled:cursor-not-allowed"
      >
        Voltar
      </button>
      <button
        type="button"
        onClick={finalize}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary-500 hover:bg-secondary-600 text-white text-xs font-semibold cursor-pointer transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 size={12} className="animate-spin" />}
        Confirmar
      </button>
    </div>
  );
}

// Aviso do painel da OS: explica o efeito antes de finalizar
export function FinalizeOrdemServicoCallout({
  ordemServico,
  canFinalize,
  notasCount,
}: {
  ordemServico: OrdemServico;
  canFinalize: boolean;
  notasCount?: number;
}) {
  const { finalize, loading } = useFinalizeOrdemServico(ordemServico);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap rounded-lg border border-success-border bg-success-bg px-3.5 py-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <CheckCircle2 size={18} className="text-success-text shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-success-text">OS quitada. Não há saldo a liquidar.</p>
            <p className="text-xs text-success-text/90 mt-0.5">
              {notasCount === undefined
                ? "Todo o valor da OS foi liquidado em notas fiscais."
                : `Todo o valor da OS foi liquidado em ${notasCount} ${notasCount === 1 ? "nota fiscal" : "notas fiscais"}.`}
            </p>
          </div>
        </div>
        {canFinalize && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-secondary-500 hover:bg-secondary-600 text-white text-sm font-medium cursor-pointer transition-colors"
          >
            <CheckCircle2 size={15} />
            Finalizar OS
          </button>
        )}
      </div>

      {confirming && (
        <div className="rounded-lg border border-border bg-surface-muted px-3.5 py-3 space-y-3">
          <p className="text-sm text-text-primary">
            <span className="font-semibold">Finalizar a OS {ordemServico.numero}?</span> Ela sai das ativas e passa para
            “Finalizadas”. Dá para reabrir pela edição da OS.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="px-3.5 py-2 rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-muted text-sm cursor-pointer transition-colors disabled:cursor-not-allowed"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={finalize}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-secondary-500 hover:bg-secondary-600 text-white text-sm font-medium cursor-pointer transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Finalizar OS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
