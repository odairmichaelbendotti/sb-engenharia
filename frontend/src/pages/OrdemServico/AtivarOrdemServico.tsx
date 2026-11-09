import { useState, type MouseEvent } from "react";
import { Calculator, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button, ConfirmDialog } from "../../components/ui";
import { usePermission } from "../../hooks/usePermission";
import { useMedicoes } from "../../store/medicoes";
import { useObras } from "../../store/obras";
import { useOrdensServico } from "../../store/ordensServico";
import { formatCurrency } from "../../utils/format-currency";
import { abrirOrcamento } from "./orcamento-link";

// O que a ativação precisa saber da OS (serve para a OS da lista e para a OS dentro da obra)
export type AtivarOrdemServicoInfo = {
  id: string;
  numero: string;
  temOrcamento: boolean;
  valorPlanejado: number | null;
  valor: number;
};

function rotulo(numero: string) {
  return /^OS\b/i.test(numero) ? numero : `OS ${numero}`;
}

/**
 * Ativar a OS planejada = emiti-la para a empresa (POST /ordem-servico/:id/emitir). Com orçamento,
 * confirma e emite; sem orçamento, explica que ele falta e leva à planilha, porque o valor da OS e
 * dos empenhos sai dele. O backend confere orçamento, empenhos e saldo; a recusa vira toast.
 */
export function AtivarOrdemServicoDialog({
  ordemServico,
  onClose,
}: {
  ordemServico: AtivarOrdemServicoInfo;
  onClose: () => void;
}) {
  const emitirOrdemServico = useMedicoes((s) => s.emitirOrdemServico);
  const fetchOrdensServico = useOrdensServico((s) => s.fetchOrdensServico);
  const fetchObras = useObras((s) => s.fetchObras);
  const { canEditEngenharia } = usePermission();
  const [enviando, setEnviando] = useState(false);

  if (!ordemServico.temOrcamento) {
    return (
      <ConfirmDialog
        open
        tone="neutral"
        icon={Calculator}
        title={`Falta o orçamento da ${rotulo(ordemServico.numero)}`}
        confirmLabel="Lançar orçamento"
        confirmDisabled={!canEditEngenharia}
        onConfirm={() => {
          abrirOrcamento(ordemServico.id);
          onClose();
        }}
        onCancel={onClose}
      >
        <p>
          A OS está planejada e só pode ser ativada depois que o orçamento for lançado: o valor da OS e dos empenhos sai
          dele.
        </p>
        <p>
          {canEditEngenharia
            ? "O orçamento abre numa aba nova. Depois de salvá-lo, volte aqui e clique em “Ativar OS”."
            : "Peça para a Engenharia lançar o orçamento. Depois disso, a OS pode ser ativada aqui."}
        </p>
      </ConfirmDialog>
    );
  }

  async function ativar() {
    setEnviando(true);
    try {
      await emitirOrdemServico(ordemServico.id);
      toast.success(`${rotulo(ordemServico.numero)} ativada: a empresa tem 48 horas para dar ciência.`);
      // A OS sai de "Planejada" e o valor entra no emitido da obra
      await Promise.all([fetchOrdensServico().catch(() => undefined), fetchObras().catch(() => undefined)]);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao ativar a ordem de serviço");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ConfirmDialog
      open
      tone="neutral"
      icon={PlayCircle}
      title={`Ativar a ${rotulo(ordemServico.numero)}?`}
      confirmLabel="Ativar OS"
      loading={enviando}
      onConfirm={ativar}
      onCancel={onClose}
    >
      A OS deixa de ser planejada e é emitida para a empresa: o valor de{" "}
      {formatCurrency(ordemServico.valorPlanejado ?? ordemServico.valor)} entra no emitido e no saldo dos empenhos, e a
      empresa passa a ver a OS e tem 48 horas para dar ciência.
    </ConfirmDialog>
  );
}

/**
 * Botão "Ativar OS" da OS planejada (linha da lista, modal da OS, cartão na obra). Some para quem
 * não pode emitir OS. O clique não chega à linha/cartão em volta, nem o do diálogo (portal).
 */
export function AtivarOrdemServicoButton({
  ordemServico,
  variant = "secondary",
}: {
  ordemServico: AtivarOrdemServicoInfo;
  variant?: "primary" | "secondary";
}) {
  const { canCreateOrdemServico } = usePermission();
  const [open, setOpen] = useState(false);
  if (!canCreateOrdemServico) return null;

  const stop = (e: MouseEvent) => e.stopPropagation();
  return (
    <span className="contents" onClick={stop}>
      <Button
        variant={variant}
        size="sm"
        icon={PlayCircle}
        onClick={() => setOpen(true)}
        title={ordemServico.temOrcamento ? "Emitir a OS para a empresa" : "Falta lançar o orçamento para ativar"}
      >
        Ativar OS
      </Button>
      {open && <AtivarOrdemServicoDialog ordemServico={ordemServico} onClose={() => setOpen(false)} />}
    </span>
  );
}
