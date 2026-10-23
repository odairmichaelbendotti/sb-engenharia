import { useState } from "react";
import { toast } from "sonner";
import type { OrdemServico } from "../../../types/ordem-servico";
import { useOrdensServico } from "../../store/ordensServico";
import { formatCurrency } from "../../utils/format-currency";
import { ConfirmDialog } from "../../components/ui";

interface DeleteOrdemServicoModalProps {
  isOpen: boolean;
  ordemServico: OrdemServico | null;
  handleClose: () => void;
}

export function DeleteOrdemServicoModal({ isOpen, ordemServico, handleClose }: DeleteOrdemServicoModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { deleteOrdemServico } = useOrdensServico();

  if (!isOpen || !ordemServico) return null;
  const blocked = ordemServico.obra !== null;

  async function handleConfirm() {
    if (!ordemServico) return;
    try {
      setIsLoading(true);
      await deleteOrdemServico(ordemServico.id);
      toast.success("Ordem de serviço excluída com sucesso");
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir ordem de serviço";
      // Depois que a empresa abriu, deu ciência ou apontou, o histórico é prova: só cancelar
      toast.error(
        message.includes("already has a history with the company")
          ? "A empresa já interagiu com esta OS (abriu, deu ciência ou fez apontamento). Cancele-a em vez de excluir: o histórico precisa ser mantido."
          : message,
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ConfirmDialog
      open
      title={`Excluir a ${/^OS\b/i.test(ordemServico.numero) ? ordemServico.numero : `OS ${ordemServico.numero}`}?`}
      confirmLabel="Excluir OS"
      loading={isLoading}
      confirmDisabled={blocked}
      onConfirm={handleConfirm}
      onCancel={handleClose}
    >
      <p>
        <span className="font-semibold text-text-primary">{formatCurrency(ordemServico.valor)}</span> em{" "}
        {ordemServico.empenhos.map((v) => v.numero).join(", ")} ({ordemServico.empenho.contrato.identificador}). O valor
        volta a ficar livre nos empenhos. Esta ação não pode ser desfeita.
      </p>
      {blocked && (
        <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger-text">
          A OS está vinculada à obra “{ordemServico.obra?.nome}”. Exclua ou realoque a obra antes de excluir a ordem de
          serviço.
        </p>
      )}
    </ConfirmDialog>
  );
}
