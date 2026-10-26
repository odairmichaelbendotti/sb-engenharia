import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cx } from "../../utils/cx";

export type OrdemServicoTab = "ALL" | "ATIVO" | "QUITADA" | "FINALIZADO" | "CANCELADO" | "SEM_OBRA";

type TabCounts = Record<OrdemServicoTab, number>;

interface OrdemServicoStatusTabsProps {
  value: OrdemServicoTab;
  counts: TabCounts;
  onChange: (tab: OrdemServicoTab) => void;
}

const TABS: { id: OrdemServicoTab; label: string; dotClass?: string }[] = [
  { id: "ALL", label: "Todas" },
  { id: "ATIVO", label: "Ativas", dotClass: "bg-neutral-800" },
  { id: "FINALIZADO", label: "Finalizadas", dotClass: "bg-primary-300" },
  { id: "CANCELADO", label: "Canceladas", dotClass: "bg-primary-300" },
];

// Aparência comum das abas: neutras, a ativa em grafite; a cor fica só no ponto/ícone de cada situação
function tabClass(active: boolean) {
  return cx(
    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200",
    active
      ? "bg-primary-500 border-primary-500 text-white"
      : "bg-surface border-border text-text-secondary hover:bg-surface-muted hover:text-text-primary",
  );
}

function countClass(active: boolean) {
  return cx("text-[11px] tabular-nums", active ? "text-white/80" : "text-text-muted");
}

export function OrdemServicoStatusTabs({ value, counts, onChange }: OrdemServicoStatusTabsProps) {
  const quitadaActive = value === "QUITADA";
  const semObraActive = value === "SEM_OBRA";

  return (
    <div role="tablist" aria-label="Filtrar por situação" className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
      {TABS.flatMap((tab) => {
        const active = value === tab.id;
        const button = (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={tabClass(active)}
          >
            {tab.dotClass && (
              <span className={cx("w-1.5 h-1.5 rounded-full", active ? "bg-white" : tab.dotClass)} />
            )}
            {tab.label}
            <span className={countClass(active)}>{counts[tab.id]}</span>
          </button>
        );
        // "Quitadas" fica logo depois de "Ativas" e só aparece quando há OS paga esperando finalização
        if (tab.id !== "ATIVO" || counts.QUITADA === 0) return [button];
        return [
          button,
          <button
            key="QUITADA"
            type="button"
            role="tab"
            aria-selected={quitadaActive}
            onClick={() => onChange("QUITADA")}
            title="OS ativas com todo o valor liquidado: prontas para finalizar"
            className={tabClass(quitadaActive)}
          >
            <CheckCircle2 size={12} className={quitadaActive ? undefined : "text-success-text"} />
            Quitadas
            <span className={countClass(quitadaActive)}>{counts.QUITADA}</span>
          </button>,
        ];
      })}

      {/* Só aparece quando há pendência: substitui o antigo banner de OS sem obra */}
      {counts.SEM_OBRA > 0 && (
        <button
          type="button"
          role="tab"
          aria-selected={semObraActive}
          onClick={() => onChange("SEM_OBRA")}
          title="OS ativas sem obra vinculada: crie a obra em Engenharia › Obras e selecione a OS"
          className={tabClass(semObraActive)}
        >
          <AlertTriangle size={12} className={semObraActive ? undefined : "text-warning-text"} />
          Sem obra
          <span className={countClass(semObraActive)}>{counts.SEM_OBRA}</span>
        </button>
      )}
    </div>
  );
}
