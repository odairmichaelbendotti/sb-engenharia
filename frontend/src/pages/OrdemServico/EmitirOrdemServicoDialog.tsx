import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import type { OrdemServico } from "../../../types/ordem-servico";
import { ConfirmDialog } from "../../components/ui";
import { useMedicoes } from "../../store/medicoes";
import { useOrdensServico } from "../../store/ordensServico";
import { formatCurrency } from "../../utils/format-currency";

/**
 * Emissão rápida da OS planejada (menu ⋯ da lista): a mesma ação do "Emitir OS" do orçamento.
 * O backend confere o orçamento, os empenhos e o saldo livre; o motivo de uma recusa vira toast.
 */
export function EmitirOrdemServicoDialog({ ordemServico, onClose }: { ordemServico: OrdemServico; onClose: () => void }) {
  const emitirOrdemServico = useMedicoes((s) => s.emitirOrdemServico);
  const fetchOrdensServico = useOrdensServico((s) => s.fetchOrdensServico);
  const [enviando, setEnviando] = useState(false);

  async function emitir() {
    setEnviando(true);
    try {
      await emitirOrdemServico(ordemServico.id);
      toast.success(`OS ${ordemServico.numero} emitida: a empresa tem 48 horas para dar ciência.`);
      await fetchOrdensServico().catch(() => undefined);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao emitir a ordem de serviço");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ConfirmDialog
      open
      tone="neutral"
      icon={Send}
      title={`Emitir a ${ordemServico.numero} para a empresa?`}
      confirmLabel="Emitir OS"
      loading={enviando}
      onConfirm={emitir}
      onCancel={onClose}
    >
      A OS deixa de ser planejada: o valor de {formatCurrency(ordemServico.valorPlanejado ?? ordemServico.valor)} entra no
      emitido e no saldo dos empenhos, e a empresa passa a ver a OS e tem 48 horas para dar ciência.
    </ConfirmDialog>
  );
}
