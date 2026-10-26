import type { ReactNode } from "react";
import { ArrowLeft, Eye, ListChecks, Ruler } from "lucide-react";
import { Link, NavLink } from "react-router";
import type { PlanilhaOrcamento } from "../../../types/medicao";
import { useEntityViewer } from "../../store/entityViewer";
import { formatCurrency } from "../../utils/format-currency";
import { cx } from "../../utils/cx";
import { OrdemServicoNumeroTag } from "../../components/OrdemServicoNumeroTag";
import { Button, StatTile, StatTiles, StatusPill } from "../../components/ui";
import { percent } from "./medicao-progress";

// Casca das telas de orçamento e de medição: largura cheia, sem a margem de baixo (o rodapé fixo encosta)
export function WorkspacePage({ children }: { children: ReactNode }) {
  return <div className="px-4 pt-4 md:px-5 md:pt-5 max-w-7xl mx-auto min-h-full flex flex-col">{children}</div>;
}

const OS_STATUS_LABEL = { ATIVO: "Ativa", FINALIZADO: "Finalizada", CANCELADO: "Cancelada" } as const;

/**
 * Cabeçalho das telas de trabalho: volta para a lista, identifica obra · OS · empresa · contrato
 * (faixa na cor do contrato), mostra os totais e alterna entre orçamento e medições.
 */
export function WorkspaceHeader({ planilha }: { planilha: PlanilhaOrcamento }) {
  const openViewer = useEntityViewer((s) => s.open);
  const { ordemServico: os, totais, valorOs, itens } = planilha;
  const titulo = os.obra?.nome ?? os.descricaoEmpenho;
  const medido = totais.valorOrcado > 0 ? totais.valorMedido / totais.valorOrcado : 0;

  return (
    <div className="space-y-4 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          to="/medicoes"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
        >
          <ArrowLeft size={14} />
          Medições
        </Link>
        <Button variant="ghost" size="sm" icon={Eye} onClick={() => openViewer({ kind: "ordemServico", id: os.id })}>
          Ver OS
        </Button>
      </div>

      <div className="flex gap-3 min-w-0">
        <span className="w-1 rounded-full shrink-0" style={{ backgroundColor: os.contrato.cor }} aria-hidden />
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight leading-6 text-text-primary truncate" title={titulo}>
            {titulo}
          </h1>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-[11px] text-text-muted min-w-0">
            <OrdemServicoNumeroTag numero={os.numero} />
            <span className="truncate" title={`${os.empresa.name} · ${os.contrato.identificador}`}>
              {os.empresa.name} · {os.contrato.identificador}
            </span>
            {os.status !== "ATIVO" && (
              <StatusPill tone="closed" size="sm" title="Orçamento e medições ficam só para consulta">
                OS {OS_STATUS_LABEL[os.status].toLowerCase()}
              </StatusPill>
            )}
          </div>
        </div>
      </div>

      {itens.length > 0 && (
        <StatTiles>
          <StatTile
            label="Valor da OS"
            value={valorOs !== null ? formatCurrency(valorOs) : "—"}
            hint={valorOs !== null ? "com BDI e desconto do lote" : "visível para a engenharia"}
          />
          <StatTile label="Orçado" value={formatCurrency(totais.valorOrcado)} hint={`${itens.length} itens`} />
          <StatTile
            label="Medido"
            value={formatCurrency(totais.valorMedido)}
            hint={`${percent(medido)}% do orçado${totais.valorRascunho > 0 ? ` · ${formatCurrency(totais.valorRascunho)} em rascunho` : ""}`}
          />
          <StatTile
            label="Saldo a medir"
            value={totais.valorSaldo <= 0 ? "Totalmente medido" : formatCurrency(totais.valorSaldo)}
            valueTone={totais.valorSaldo <= 0 ? "success" : "default"}
          />
        </StatTiles>
      )}

      <nav aria-label="Orçamento e medições" className="flex items-center gap-1.5 border-b border-border">
        <WorkspaceTab to={`/medicoes/${os.id}/orcamento`} icon={ListChecks} label="Orçamento" />
        <WorkspaceTab to={`/medicoes/${os.id}/medicoes`} icon={Ruler} label="Medições" />
      </nav>
    </div>
  );
}

function WorkspaceTab({ to, icon: Icon, label }: { to: string; icon: typeof Ruler; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          "inline-flex items-center gap-1.5 h-9 px-3 -mb-px border-b-2 text-sm cursor-pointer transition-colors",
          isActive
            ? "border-primary-500 text-text-primary font-semibold"
            : "border-transparent text-text-secondary hover:text-text-primary",
        )
      }
    >
      <Icon size={15} />
      {label}
    </NavLink>
  );
}

// Rodapé fixo na parte de baixo da tela: totais ao vivo à esquerda, ações à direita
export function StickyFooter({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 mt-auto -mx-4 md:-mx-5 border-t border-border bg-surface px-4 md:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">{summary}</div>
      <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
    </div>
  );
}
