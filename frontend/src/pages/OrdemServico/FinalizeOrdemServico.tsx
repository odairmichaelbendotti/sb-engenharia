import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { OrdemServico } from "../../../types/ordem-servico";
import { useOrdensServico } from "../../store/ordensServico";
import { Button, ConfirmDialog } from "../../components/ui";

// Confirmação de "Finalizar OS" (menu ⋯ da linha e aviso do modal)
export function FinalizeOrdemServicoDialog({
  ordemServico,
  open,
  onClose,
}: {
  ordemServico: OrdemServico;
  open: boolean;
  onClose: () => void;
}) {
  const updateStatus = useOrdensServico((s) => s.updateOrdemServicoStatus);
  const [loading, setLoading] = useState(false);

  const finalize = async () => {
    setLoading(true);
    try {
      await updateStatus(ordemServico.id, "FINALIZADO");
      toast.success(`OS ${ordemServico.numero} finalizada`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao finalizar a ordem de serviço");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      tone="success"
      title={`Finalizar a OS ${ordemServico.numero}?`}
      confirmLabel="Finalizar OS"
      loading={loading}
      onConfirm={finalize}
      onCancel={onClose}
    >
      <p>Todo o valor da OS foi liquidado. Ela sai das ativas e passa para “Finalizadas”; dá para reabrir pela edição.</p>
    </ConfirmDialog>
  );
}

// Aviso do modal da OS quitada, com o botão que pede a confirmação
export function FinalizeOrdemServicoCallout({
  ordemServico,
  canFinalize,
  notasCount,
}: {
  ordemServico: OrdemServico;
  canFinalize: boolean;
  notasCount?: number;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
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
        {canFinalize && (
          <Button variant="success" size="sm" icon={CheckCircle2} onClick={() => setConfirming(true)}>
            Finalizar OS
          </Button>
        )}
      </div>
      <FinalizeOrdemServicoDialog ordemServico={ordemServico} open={confirming} onClose={() => setConfirming(false)} />
    </>
  );
}
