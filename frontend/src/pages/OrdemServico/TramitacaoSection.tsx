import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCheck,
  CircleSlash,
  Eye,
  FileCheck2,
  FilePen,
  Flag,
  Loader2,
  MessageSquare,
  MessageSquareWarning,
  RefreshCw,
  Send,
  ThumbsDown,
  ThumbsUp,
  TimerOff,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type {
  ContestacaoStatus,
  OrdemServicoContestacao,
  OrdemServicoEvento,
  OrdemServicoEventoTipo,
  OrdemServicoTramitacao,
} from "../../../types/tramitacao";
import { useTramitacao } from "../../store/tramitacao";
import { formatDateTimeFull } from "../../utils/format-currency";
import { cx } from "../../utils/cx";
import { Badge, Button, ConfirmDialog, Field, Textarea, type BadgeTone } from "../../components/ui";
import { ROLE_LABELS } from "../Users/role-labels";
import { describePrazoCiencia, FASE_LABEL, FASE_TONE } from "./ordem-servico-ciencia";

const TEXTO_MAX = 4000;

const EVENTO_ICON: Record<OrdemServicoEventoTipo, LucideIcon> = {
  EMITIDA: Send,
  REEMITIDA: RefreshCw,
  VISUALIZADA: Eye,
  CIENTE: FileCheck2,
  PRAZO_VENCIDO: TimerOff,
  CONTESTACAO: MessageSquareWarning,
  CONTESTACAO_ACATADA: ThumbsUp,
  CONTESTACAO_RECUSADA: ThumbsDown,
  COMENTARIO: MessageSquare,
  STATUS_ALTERADO: Flag,
};

const EVENTO_LABEL: Record<OrdemServicoEventoTipo, string> = {
  EMITIDA: "OS emitida",
  REEMITIDA: "OS reemitida",
  VISUALIZADA: "Visualizada pela empresa",
  CIENTE: "Ciência da empresa",
  PRAZO_VENCIDO: "Prazo de ciência vencido",
  CONTESTACAO: "Apontamento da empresa",
  CONTESTACAO_ACATADA: "Apontamento acatado",
  CONTESTACAO_RECUSADA: "Apontamento recusado",
  COMENTARIO: "Comentário",
  STATUS_ALTERADO: "Situação alterada",
};

// Cor só onde o evento tem significado (ciência, vencimento, decisão); o resto fica neutro
const EVENTO_TONE: Partial<Record<OrdemServicoEventoTipo, string>> = {
  CIENTE: "text-success-text",
  PRAZO_VENCIDO: "text-danger-text",
  CONTESTACAO: "text-warning-text",
  CONTESTACAO_ACATADA: "text-success-text",
  CONTESTACAO_RECUSADA: "text-danger-text",
};

const CONTESTACAO_LABEL: Record<ContestacaoStatus, string> = {
  ABERTA: "Aguardando decisão",
  ACATADA: "Acatado",
  RECUSADA: "Recusado",
};

const CONTESTACAO_TONE: Record<ContestacaoStatus, BadgeTone> = {
  ABERTA: "warning",
  ACATADA: "success",
  RECUSADA: "danger",
};

function autorLabel(evento: OrdemServicoEvento) {
  if (evento.autorPerfil === "SISTEMA") return "Sistema";
  const origem = evento.autorEmpresa ?? ROLE_LABELS[evento.autorPerfil] ?? evento.autorPerfil;
  return `${evento.autorNome} · ${origem}`;
}

interface TramitacaoSectionProps {
  ordemServicoId: string;
  numero: string;
  // Avisa a tela de fora (lista de OS, pendências) que a situação mudou
  onChanged?: () => void;
}

// Ciência, apontamentos e histórico da OS. A empresa dá ciência e aponta; a fiscalização decide
export function TramitacaoSection({ ordemServicoId, numero, onChanged }: TramitacaoSectionProps) {
  const { fetchTramitacao, darCiencia } = useTramitacao();
  const [data, setData] = useState<OrdemServicoTramitacao | null>(null);
  const [error, setError] = useState(false);
  const [confirmingCiencia, setConfirmingCiencia] = useState(false);
  const [savingCiencia, setSavingCiencia] = useState(false);

  const reload = useCallback(async () => {
    try {
      setData(await fetchTramitacao(ordemServicoId));
      setError(false);
    } catch {
      setError(true);
    }
  }, [fetchTramitacao, ordemServicoId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function afterAction() {
    await reload();
    onChanged?.();
  }

  async function handleCiencia() {
    setSavingCiencia(true);
    try {
      await darCiencia(ordemServicoId);
      toast.success("Ciência registrada");
      setConfirmingCiencia(false);
      await afterAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar a ciência");
    } finally {
      setSavingCiencia(false);
    }
  }

  if (error) {
    return (
      <p className="text-sm text-text-secondary">
        Não foi possível carregar o histórico.{" "}
        <button type="button" onClick={reload} className="cursor-pointer underline hover:text-text-primary">
          Tentar de novo
        </button>
      </p>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Loader2 size={14} className="animate-spin" /> Carregando histórico...
      </div>
    );
  }

  const { situacao, permissoes, eventos, contestacoes } = data;

  if (situacao.fase === "DISPENSADA") {
    return (
      <p className="flex items-start gap-2 text-sm text-text-secondary">
        <CircleSlash size={14} className="mt-0.5 shrink-0 text-text-muted" />
        Ordem de serviço anterior à ciência pelo sistema: não exige ciência da empresa.
      </p>
    );
  }

  const serverNow = new Date(situacao.serverNow);

  return (
    <div className="space-y-4">
      <SituacaoResumo data={data} serverNow={serverNow} />

      {permissoes.darCiencia && (
        <div
          className={cx(
            "flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3.5 py-3",
            situacao.fase === "CIENCIA_VENCIDA" ? "border-danger-border bg-danger-bg" : "border-warning-border bg-warning-bg",
          )}
        >
          <p className={cx("text-sm", situacao.fase === "CIENCIA_VENCIDA" ? "text-danger-text" : "text-warning-text")}>
            {situacao.fase === "CIENCIA_VENCIDA"
              ? "O prazo de ciência venceu. Dê ciência para voltar a usar o sistema."
              : "Leia a OS e confirme que está ciente. A data e a hora ficam registradas."}
          </p>
          <Button size="sm" icon={CheckCheck} onClick={() => setConfirmingCiencia(true)}>
            Estou ciente
          </Button>
        </div>
      )}

      <ContestacoesBlock
        ordemServicoId={ordemServicoId}
        contestacoes={contestacoes}
        podeContestar={permissoes.contestar}
        podeResponder={permissoes.responder}
        prazoAte={situacao.cienciaPrazoAte}
        onChanged={afterAction}
      />

      <div>
        <h4 className="text-xs font-semibold text-text-secondary mb-2">Histórico</h4>
        <Timeline eventos={eventos} />
      </div>

      {permissoes.comentar && <ComentarioForm ordemServicoId={ordemServicoId} onChanged={afterAction} />}

      <ConfirmDialog
        open={confirmingCiencia}
        tone="success"
        title={`Confirmar ciência da ${numero.startsWith("OS") ? numero : `OS ${numero}`}?`}
        confirmLabel="Estou ciente"
        loading={savingCiencia}
        onConfirm={handleCiencia}
        onCancel={() => setConfirmingCiencia(false)}
      >
        <p>A data, a hora e o seu nome ficam registrados no histórico e não podem ser desfeitos.</p>
      </ConfirmDialog>
    </div>
  );
}

function SituacaoResumo({ data, serverNow }: { data: OrdemServicoTramitacao; serverNow: Date }) {
  const { situacao } = data;
  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
      <Badge tone={FASE_TONE[situacao.fase]}>{FASE_LABEL[situacao.fase]}</Badge>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-text-secondary">
        {situacao.emitidaEm && (
          <div>
            <dt className="inline text-text-muted">Emitida no sistema: </dt>
            <dd className="inline">{formatDateTimeFull(situacao.emitidaEm)}</dd>
          </div>
        )}
        {situacao.cienciaPrazoAte && (
          <div>
            <dt className="inline text-text-muted">Prazo de ciência: </dt>
            <dd className="inline">
              {formatDateTimeFull(situacao.cienciaPrazoAte)}
              {!situacao.cienteEm && (
                <span
                  className={cx(
                    "ml-1",
                    situacao.fase === "CIENCIA_VENCIDA" ? "text-danger-text font-medium" : "text-warning-text",
                  )}
                >
                  ({describePrazoCiencia(situacao.cienciaPrazoAte, serverNow)})
                </span>
              )}
            </dd>
          </div>
        )}
        <div>
          <dt className="inline text-text-muted">Visualizada pela empresa: </dt>
          <dd className="inline">{situacao.visualizadaEm ? formatDateTimeFull(situacao.visualizadaEm) : "ainda não"}</dd>
        </div>
        <div>
          <dt className="inline text-text-muted">Ciente: </dt>
          <dd className="inline">
            {situacao.cienteEm
              ? `${formatDateTimeFull(situacao.cienteEm)}${situacao.cienteNome ? ` · ${situacao.cienteNome}` : ""}`
              : "ainda não"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Timeline({ eventos }: { eventos: OrdemServicoEvento[] }) {
  if (eventos.length === 0) {
    return <p className="text-sm text-text-muted">Nenhum registro ainda.</p>;
  }
  return (
    <ol className="relative space-y-3 before:absolute before:left-[11px] before:top-1 before:bottom-1 before:w-px before:bg-border">
      {eventos.map((evento) => {
        const Icon = EVENTO_ICON[evento.tipo];
        return (
          <li key={evento.id} className="relative flex gap-3">
            <span
              className={cx(
                "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface",
                EVENTO_TONE[evento.tipo] ?? "text-text-muted",
              )}
            >
              <Icon size={12} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium text-text-primary">{EVENTO_LABEL[evento.tipo]}</p>
                <time className="text-xs text-text-muted tabular-nums" dateTime={evento.createdAt}>
                  {formatDateTimeFull(evento.createdAt)}
                </time>
              </div>
              <p className="text-xs text-text-secondary">{autorLabel(evento)}</p>
              {evento.texto && (
                <p className="mt-1 text-sm text-text-primary whitespace-pre-line wrap-break-word">{evento.texto}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ContestacoesBlock({
  ordemServicoId,
  contestacoes,
  podeContestar,
  podeResponder,
  prazoAte,
  onChanged,
}: {
  ordemServicoId: string;
  contestacoes: OrdemServicoContestacao[];
  podeContestar: boolean;
  podeResponder: boolean;
  prazoAte: string | null;
  onChanged: () => Promise<void>;
}) {
  const { contestar } = useTramitacao();
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [saving, setSaving] = useState(false);

  if (contestacoes.length === 0 && !podeContestar) return null;

  async function handleSubmit() {
    if (!texto.trim()) {
      toast.error("Descreva o apontamento");
      return;
    }
    setSaving(true);
    try {
      await contestar(ordemServicoId, texto);
      toast.success("Apontamento registrado");
      setTexto("");
      setAberto(false);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar o apontamento");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <h4 className="text-xs font-semibold text-text-secondary">Apontamentos da empresa</h4>
        {podeContestar && !aberto && (
          <Button size="sm" variant="secondary" icon={FilePen} onClick={() => setAberto(true)}>
            Registrar apontamento
          </Button>
        )}
      </div>

      {aberto && (
        <div className="mb-3 space-y-2">
          <Field
            label="Apontamento"
            hint={`Prazo, valor, escopo ou qualquer ponto a corrigir. Dá para registrar até ${
              prazoAte ? formatDateTimeFull(prazoAte) : "o fim do prazo de ciência"
            }.`}
          >
            <Textarea rows={3} maxLength={TEXTO_MAX} value={texto} onChange={(e) => setTexto(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setAberto(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button size="sm" icon={Send} loading={saving} onClick={handleSubmit}>
              Enviar apontamento
            </Button>
          </div>
        </div>
      )}

      {contestacoes.length === 0 ? (
        !aberto && <p className="text-sm text-text-muted">Nenhum apontamento registrado.</p>
      ) : (
        <ul className="space-y-2">
          {contestacoes.map((c) => (
            <ContestacaoItem key={c.id} contestacao={c} podeResponder={podeResponder} onChanged={onChanged} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ContestacaoItem({
  contestacao: c,
  podeResponder,
  onChanged,
}: {
  contestacao: OrdemServicoContestacao;
  podeResponder: boolean;
  onChanged: () => Promise<void>;
}) {
  const { responderContestacao } = useTramitacao();
  const [respondendo, setRespondendo] = useState(false);
  const [resposta, setResposta] = useState("");
  const [saving, setSaving] = useState<"ACATADA" | "RECUSADA" | null>(null);

  async function handleDecisao(decisao: "ACATADA" | "RECUSADA") {
    if (!resposta.trim()) {
      toast.error("Escreva a resposta para a empresa");
      return;
    }
    setSaving(decisao);
    try {
      await responderContestacao(c.id, decisao, resposta);
      toast.success(decisao === "ACATADA" ? "Apontamento acatado" : "Apontamento recusado");
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao responder o apontamento");
    } finally {
      setSaving(null);
    }
  }

  return (
    <li className="rounded-lg border border-border px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-text-secondary">
          {c.autorNome} · {formatDateTimeFull(c.createdAt)}
        </p>
        <Badge tone={CONTESTACAO_TONE[c.status]}>{CONTESTACAO_LABEL[c.status]}</Badge>
      </div>
      <p className="mt-1.5 text-sm text-text-primary whitespace-pre-line wrap-break-word">{c.texto}</p>

      {c.status !== "ABERTA" && c.resposta && (
        <div className="mt-2.5 border-l-2 border-border-strong pl-3">
          <p className="text-xs text-text-secondary">
            Fiscalização · {c.respondidoPorNome}
            {c.respondidoEm ? ` · ${formatDateTimeFull(c.respondidoEm)}` : ""}
          </p>
          <p className="mt-0.5 text-sm text-text-primary whitespace-pre-line wrap-break-word">{c.resposta}</p>
        </div>
      )}

      {c.status === "ABERTA" && podeResponder && (
        <div className="mt-2.5">
          {respondendo ? (
            <div className="space-y-2">
              <Field
                label="Resposta à empresa"
                hint="Ao acatar, edite a OS para corrigir: a edição a reemite e a empresa precisa dar ciência de novo."
              >
                <Textarea rows={2} maxLength={TEXTO_MAX} value={resposta} onChange={(e) => setResposta(e.target.value)} />
              </Field>
              <div className="flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setRespondendo(false)} disabled={saving !== null}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={ThumbsDown}
                  loading={saving === "RECUSADA"}
                  disabled={saving !== null}
                  onClick={() => handleDecisao("RECUSADA")}
                >
                  Recusar
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  icon={ThumbsUp}
                  loading={saving === "ACATADA"}
                  disabled={saving !== null}
                  onClick={() => handleDecisao("ACATADA")}
                >
                  Acatar
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setRespondendo(true)}>
              Responder
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

function ComentarioForm({ ordemServicoId, onChanged }: { ordemServicoId: string; onChanged: () => Promise<void> }) {
  const { comentar } = useTramitacao();
  const [texto, setTexto] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!texto.trim()) return;
    setSaving(true);
    try {
      await comentar(ordemServicoId, texto);
      setTexto("");
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar o comentário");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <Field label="Comentário" hint="Fica no histórico com seu nome, data e hora; não pode ser editado depois.">
        <Textarea rows={2} maxLength={TEXTO_MAX} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </Field>
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" icon={MessageSquare} loading={saving} disabled={!texto.trim()} onClick={handleSubmit}>
          Comentar
        </Button>
      </div>
    </div>
  );
}

// Aviso no topo do modal para a empresa, antes de rolar até a tramitação
export function CienciaPendenteAviso({ prazoAte, vencida }: { prazoAte: string; vencida: boolean }) {
  return (
    <div
      className={cx(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3",
        vencida ? "border-danger-border bg-danger-bg" : "border-warning-border bg-warning-bg",
      )}
    >
      <AlertTriangle size={16} className={cx("shrink-0 mt-0.5", vencida ? "text-danger-text" : "text-warning-text")} />
      <p className={cx("text-sm", vencida ? "text-danger-text" : "text-warning-text")}>
        {vencida
          ? `O prazo para dar ciência desta OS venceu em ${formatDateTimeFull(prazoAte)}. Confirme a ciência em “Ciência e tramitação”, mais abaixo.`
          : `Esta OS aguarda a sua ciência até ${formatDateTimeFull(prazoAte)} (${describePrazoCiencia(prazoAte)}). Confirme em “Ciência e tramitação”, mais abaixo.`}
      </p>
    </div>
  );
}
