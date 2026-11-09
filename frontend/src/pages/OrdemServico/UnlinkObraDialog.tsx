import { useState } from "react";
import { Unlink } from "lucide-react";
import { toast } from "sonner";
import type { OrdemServico } from "../../../types/ordem-servico";
import { ConfirmDialog } from "../../components/ui";
import { useOrdensServico } from "../../store/ordensServico";

/**
 * Desvincula a OS da obra (menu ⋯ da lista). A obra continua cadastrada; se esta for a única
 * OS dela, fica sem OS até receber outra. OS com notas fiscais não sai da obra (o backend recusa).
 */
export function UnlinkObraDialog({ ordemServico, onClose }: { ordemServico: OrdemServico; onClose: () => void }) {
  const unlinkObra = useOrdensServico((s) => s.unlinkObra);
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    try {
      await unlinkObra(ordemServico.id);
      toast.success(`OS ${ordemServico.numero} desvinculada da obra`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao desvincular a obra da ordem de serviço");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ConfirmDialog
      open
      tone="neutral"
      icon={Unlink}
      title={`Desvincular a ${ordemServico.numero} da obra?`}
      confirmLabel="Desvincular obra"
      loading={isLoading}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      A obra “{ordemServico.obra?.nome}” continua cadastrada. Se esta for a única OS dela, a obra fica sem OS até receber
      outra.
    </ConfirmDialog>
  );
}
