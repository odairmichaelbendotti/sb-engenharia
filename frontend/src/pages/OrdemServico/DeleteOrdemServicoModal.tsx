import { useState } from "react";
import { Unlink } from "lucide-react";
import { toast } from "sonner";
import type { OrdemServico } from "../../../types/ordem-servico";
import { useOrdensServico } from "../../store/ordensServico";
import { formatCurrency } from "../../utils/format-currency";
import { Button, ConfirmDialog } from "../../components/ui";

interface DeleteOrdemServicoModalProps {
  isOpen: boolean;
  ordemServico: OrdemServico | null;
  handleClose: () => void;
}

export function DeleteOrdemServicoModal({ isOpen, ordemServico, handleClose }: DeleteOrdemServicoModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const { deleteOrdemServico, unlinkObra } = useOrdensServico();
  // Lê a versão do store: depois de desvincular a obra, o aviso some e o Excluir é liberado
  const current = useOrdensServico((s) => s.data?.ordensServico.find((os) => os.id === ordemServico?.id));

  if (!isOpen || !ordemServico) return null;
  const obra = current ? current.obra : ordemServico.obra;
  const blocked = obra !== null;

  async function handleUnlink() {
    if (!ordemServico) return;
    try {
      setIsUnlinking(true);
      await unlinkObra(ordemServico.id);
      toast.success("OS desvinculada da obra");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao desvincular a obra da ordem de serviço");
    } finally {
      setIsUnlinking(false);
    }
  }

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
        <div className="flex flex-col gap-2 rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger-text">
          <p>
            A OS está vinculada à obra “{obra?.nome}”. Desvincule-a para poder excluir; a obra continua cadastrada.
          </p>
          <Button variant="secondary" size="sm" icon={Unlink} loading={isUnlinking} onClick={handleUnlink} className="self-start">
            Desvincular da obra
          </Button>
        </div>
      )}
    </ConfirmDialog>
  );
}
