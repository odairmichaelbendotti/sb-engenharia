import { useEffect, useMemo, useState } from "react";
import { CheckCheck, ClipboardCheck, Eye, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useTramitacao } from "../../store/tramitacao";
import { PageHeader } from "../../components/PageHeader";
import { ConfirmModal } from "../../components/ConfirmModal";
import { OrdemServicoNumeroTag } from "../../components/OrdemServicoNumeroTag";
import { Button } from "../../components/ui";
import { formatCurrency, formatDateTimeFull } from "../../utils/format-currency";
import { cx } from "../../utils/cx";
import { ViewOrdemServicoModal } from "../OrdemServico";
import { describePrazoCiencia } from "../OrdemServico/ordem-servico-ciencia";
import type { PendenciaCiencia } from "../../../types/tramitacao";

interface PendenciasCienciaProps {
  // Prazo vencido: é a única tela que a empresa acessa até dar ciência (ver AppLayout)
  bloqueada?: boolean;
}

// OS da empresa aguardando ciência, com o prazo de cada uma e o "Estou ciente"
export default function PendenciasCiencia({ bloqueada = false }: PendenciasCienciaProps) {
  const { pendencias, fetchPendencias, darCiencia } = useTramitacao();
  const [loading, setLoading] = useState(pendencias === null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<PendenciaCiencia | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPendencias()
      .catch(() => toast.error("Erro ao carregar as pendências de ciência"))
      .finally(() => setLoading(false));
  }, [fetchPendencias]);

  const lista = useMemo(() => pendencias?.pendencias ?? [], [pendencias]);
  const viewing = lista.find((p) => p.ordemServico.id === viewingId)?.ordemServico ?? null;
  const serverNow = pendencias ? new Date(pendencias.serverNow) : new Date();

  async function handleCiencia() {
    if (!confirming) return;
    setSaving(true);
    try {
      await darCiencia(confirming.ordemServico.id);
      toast.success("Ciência registrada");
      setConfirming(null);
      await fetchPendencias();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar a ciência");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-5 max-w-5xl mx-auto">
      <PageHeader icon={ClipboardCheck} title="Pendências de ciência" canAct={false} />

      {bloqueada && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg px-3.5 py-3">
          <Lock size={16} className="text-danger-text shrink-0 mt-0.5" />
          <p className="text-sm text-danger-text">
            O acesso ao sistema está bloqueado: há ordem de serviço com o prazo de ciência vencido. Abra a OS, leia e
            confirme a ciência para liberar as demais telas.
          </p>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl">
        <p className="px-4 py-3 border-b border-border text-xs text-text-secondary">
          Cada OS emitida para a empresa precisa de ciência em até 48 horas corridas. A data, a hora e quem confirmou
          ficam registradas no histórico da OS.
        </p>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 size={28} className="mx-auto text-text-muted animate-spin mb-3" />
            <p className="text-text-secondary text-sm">Carregando pendências...</p>
          </div>
        ) : lista.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCheck size={28} className="mx-auto text-success-text mb-2" />
            <p className="text-sm text-text-secondary">Nenhuma ordem de serviço aguardando ciência</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {lista.map((p) => {
              const os = p.ordemServico;
              const titulo = os.obra?.nome ?? os.empenho.description;
              return (
                <li key={os.id} className="flex flex-col md:flex-row md:items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-table font-semibold text-text-primary line-clamp-2" title={titulo}>
                      {titulo}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
                      <OrdemServicoNumeroTag numero={os.numero} />
                      <span>{os.empenho.contrato.identificador}</span>
                      <span className="text-text-muted">·</span>
                      <span className="tabular-nums">{formatCurrency(os.valor)}</span>
                    </div>
                  </div>
                  <div className="md:text-right text-xs shrink-0">
                    <p className="text-text-muted">Ciência até</p>
                    <p className="tabular-nums text-text-primary font-medium">{formatDateTimeFull(p.cienciaPrazoAte)}</p>
                    <p className={cx("tabular-nums", p.vencida ? "text-danger-text font-medium" : "text-warning-text")}>
                      {describePrazoCiencia(p.cienciaPrazoAte, serverNow)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="secondary" icon={Eye} onClick={() => setViewingId(os.id)}>
                      Abrir OS
                    </Button>
                    <Button size="sm" icon={CheckCheck} onClick={() => setConfirming(p)}>
                      Estou ciente
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {viewing && (
        <ViewOrdemServicoModal
          ordemServico={viewing}
          handleClose={() => setViewingId(null)}
          onTramitacaoChanged={() => fetchPendencias().catch(() => {})}
        />
      )}

      <ConfirmModal
        open={confirming !== null}
        variant="success"
        message={`Confirmar ciência da ${confirming?.ordemServico.numero ?? "OS"}? A data, a hora e o seu nome ficam registrados no histórico e não podem ser desfeitos.`}
        confirmLabel="Estou ciente"
        isLoading={saving}
        onConfirm={handleCiencia}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
