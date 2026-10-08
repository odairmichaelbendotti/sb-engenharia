import { AlertTriangle, CheckCircle2 } from "lucide-react";

export type OrdemServicoTab = "ALL" | "ATIVO" | "QUITADA" | "FINALIZADO" | "CANCELADO" | "SEM_OBRA";

type TabCounts = Record<OrdemServicoTab, number>;

interface OrdemServicoStatusTabsProps {
  value: OrdemServicoTab;
  counts: TabCounts;
  onChange: (tab: OrdemServicoTab) => void;
}

const TABS: { id: OrdemServicoTab; label: string; dotClass?: string }[] = [
  { id: "ALL", label: "Todas" },
  { id: "ATIVO", label: "Ativas", dotClass: "bg-primary-500" },
  { id: "FINALIZADO", label: "Finalizadas", dotClass: "bg-success-text" },
  { id: "CANCELADO", label: "Canceladas", dotClass: "bg-danger-text" },
];

export function OrdemServicoStatusTabs({ value, counts, onChange }: OrdemServicoStatusTabsProps) {
  const quitadaActive = value === "QUITADA";

  return (
    <div role="tablist" aria-label="Filtrar por situação" className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
      {TABS.flatMap((tab) => {
        const active = value === tab.id;
        const button = (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors cursor-pointer ${
              active
                ? "bg-primary-500 border-primary-500 text-white"
                : "bg-surface border-border text-text-secondary hover:bg-surface-muted"
            }`}
          >
            {tab.dotClass && (
              <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white" : tab.dotClass}`} />
            )}
            {tab.label}
            <span className={`text-xs tabular-nums ${active ? "text-white/80" : "text-text-muted"}`}>
              {counts[tab.id]}
            </span>
          </button>
        );
        // "Quitadas" fica logo depois de "Ativas" e só aparece quando há OS paga esperando finalização
        if (tab.id !== "ATIVO" || counts.QUITADA === 0) return [button];
        return [
          button,
          <button
            key="QUITADA"
            role="tab"
            aria-selected={quitadaActive}
            onClick={() => onChange("QUITADA")}
            title="OS ativas com todo o valor liquidado: prontas para finalizar"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors cursor-pointer ${
              quitadaActive
                ? "bg-success-text border-success-text text-white"
                : "bg-success-bg border-success-border text-success-text hover:brightness-95"
            }`}
          >
            <CheckCircle2 size={13} />
            Quitadas
            <span className="text-xs tabular-nums font-semibold">{counts.QUITADA}</span>
          </button>,
        ];
      })}

      {/* Só aparece quando há pendência: substitui o antigo banner de OS sem obra */}
      {counts.SEM_OBRA > 0 && (
        <button
          role="tab"
          aria-selected={value === "SEM_OBRA"}
          onClick={() => onChange("SEM_OBRA")}
          title="OS ativas sem obra vinculada: crie a obra em Engenharia › Obras e selecione a OS"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors cursor-pointer ${
            value === "SEM_OBRA"
              ? "bg-warning-text border-warning-text text-white"
              : "bg-warning-bg border-warning-border text-warning-text hover:brightness-95"
          }`}
        >
          <AlertTriangle size={13} />
          Sem obra
          <span className="text-xs tabular-nums font-semibold">{counts.SEM_OBRA}</span>
        </button>
      )}
    </div>
  );
}
