import { useEffect, useRef, useState } from "react";
import { Building2, ChevronDown, FileSignature, FileText, SlidersHorizontal, type LucideIcon } from "lucide-react";
import type { ScopeFilter } from "../../hooks/useScopeFilter";
import type { ScopeOption, ScopeOptions } from "./scope-options";

interface ScopeFilterButtonProps {
  options: ScopeOptions;
  value: ScopeFilter;
  onChange: (patch: Partial<ScopeFilter>) => void;
}

// Botão "Filtros" com empresa, contrato e empenho num painel: a barra fica limpa e os filtros
// ativos aparecem como etiquetas no FilterSummary
export function ScopeFilterButton({ options, value, onChange }: ScopeFilterButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeCount = [value.empresa, value.contrato, value.empenho].filter(Boolean).length;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Nível com uma opção só não filtra nada (ex.: login de empresa): fica escondido
  const show = (list: ScopeOption[], selected: string) => list.length > 1 || Boolean(selected);
  const showEmpresa = show(options.empresas, value.empresa);
  const showContrato = show(options.contratos, value.contrato);
  const showEmpenho = show(options.empenhos, value.empenho);
  const nothingToFilter = !showEmpresa && !showContrato && !showEmpenho;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer transition-colors ${
          activeCount > 0
            ? "border-primary-300 bg-primary-50 text-primary-700 font-medium"
            : "border-border bg-surface text-text-secondary hover:bg-surface-muted"
        }`}
      >
        <SlidersHorizontal size={14} />
        Filtros
        {activeCount > 0 && (
          <span className="min-w-5 h-5 px-1 rounded-full bg-primary-500 text-white text-[11px] font-semibold tabular-nums inline-flex items-center justify-center">
            {activeCount}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Filtros"
          className="absolute right-0 top-full mt-1.5 z-30 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface shadow-lg p-3 space-y-3"
        >
          {nothingToFilter && (
            <p className="text-sm text-text-muted">Todos os itens são da mesma empresa, contrato e empenho.</p>
          )}
          {showEmpresa && (
            <ScopeSelect
              icon={Building2}
              label="Empresa"
              allLabel="Todas as empresas"
              options={options.empresas}
              value={value.empresa}
              onChange={(empresa) => onChange({ empresa, contrato: "", empenho: "" })}
            />
          )}
          {showContrato && (
            <ScopeSelect
              icon={FileText}
              label="Contrato"
              allLabel="Todos os contratos"
              options={options.contratos}
              value={value.contrato}
              onChange={(contrato) => onChange({ contrato, empenho: "" })}
            />
          )}
          {showEmpenho && (
            <ScopeSelect
              icon={FileSignature}
              label="Empenho"
              allLabel="Todos os empenhos"
              options={options.empenhos}
              value={value.empenho}
              onChange={(empenho) => onChange({ empenho })}
            />
          )}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <button
              type="button"
              onClick={() => onChange({ empresa: "", contrato: "", empenho: "" })}
              disabled={activeCount === 0}
              className="text-sm text-primary-500 hover:text-primary-600 font-medium cursor-pointer disabled:text-text-muted disabled:cursor-default pt-2"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-text-secondary hover:text-text-primary cursor-pointer pt-2"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScopeSelect({
  icon: Icon,
  label,
  allLabel,
  options,
  value,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  allLabel: string;
  options: ScopeOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <span className="relative block mt-1">
        <Icon
          size={14}
          className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
            value ? "text-primary-500" : "text-text-muted"
          }`}
        />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-8 pr-3 py-2 border rounded-lg bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 cursor-pointer ${
            value ? "border-primary-300 font-medium" : "border-border"
          }`}
        >
          <option value="">{allLabel}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label} ({option.count})
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}
