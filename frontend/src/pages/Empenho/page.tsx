import { useState, useMemo, useEffect } from "react";
import { useEmpenhos } from "../../store/empenhos";
import type { EmpenhoList } from "../../../types/empenho";
import { EmpenhoFilters, EmpenhoTable, EmpenhoModal, DeleteEmpenhoModal } from "./index";
import { formatCurrency } from "../../utils/format-currency";
import { usePermission } from "../../hooks/usePermission";
import { EMPTY_SCOPE, useScopeFilter } from "../../hooks/useScopeFilter";
import { PageHeader } from "../../components/PageHeader";
import { SummaryStrip, type SummaryCell } from "../../components/SummaryStrip";
import { matchesScope, resolveScope, scopeChips, type ScopeRef } from "../../components/filters/scope-options";
import { FilterSummary } from "../../components/filters/FilterSummary";
import { Layers2 } from "lucide-react";

function empenhoScopeRefs(empenho: EmpenhoList): ScopeRef[] {
  if (!empenho.contrato) return [];
  return [
    {
      empresa: { id: empenho.contrato.company.id, name: empenho.contrato.company.name },
      contrato: { id: empenho.contrato.id, identificador: empenho.contrato.identificador },
      empenho: { id: empenho.id, numero: empenho.numero },
    },
  ];
}

export default function Empenhos() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingEmpenho, setEditingEmpenho] = useState<EmpenhoList | null>(
    null,
  );
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [empenhoToDelete, setEmpenhoToDelete] = useState<EmpenhoList | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isListLoading, setIsListLoading] = useState(true);
  const [scope, setScope] = useScopeFilter();

  const { fetchListEmpenhos, data } = useEmpenhos();

  const empenhos = useMemo(() => data?.empenhos || [], [data]);

  // Valor escolhido em outra tela que não existe aqui é ignorado
  const { options: scopeOptions, active: activeScope } = useMemo(
    () => resolveScope(empenhos, empenhoScopeRefs, scope),
    [empenhos, scope],
  );
  const scopeKey = `${activeScope.empresa}|${activeScope.contrato}|${activeScope.empenho}`;

  const filteredEmpenhos = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return empenhos.filter(
      (empenho) =>
        matchesScope(empenhoScopeRefs(empenho), activeScope) &&
        (!s ||
          empenho.numero.toLowerCase().includes(s) ||
          empenho.description.toLowerCase().includes(s) ||
          empenho.contrato?.identificador.toLowerCase().includes(s) ||
          empenho.contrato?.company.name.toLowerCase().includes(s)),
    );
  }, [empenhos, searchTerm, activeScope]);

  useEffect(() => {
    fetchListEmpenhos().finally(() => setIsListLoading(false));
  }, [fetchListEmpenhos]);

  // Totais dos empenhos que passam pelos filtros (cancelados não entram nos valores)
  const summaryCells = useMemo<SummaryCell[]>(() => {
    const validos = filteredEmpenhos.filter((e) => e.status.toUpperCase() !== "CANCELADO");
    const ativos = validos.filter((e) => e.status.toUpperCase() === "ATIVO").length;
    const empenhado = validos.reduce((acc, e) => acc + e.value, 0);
    const emOs = validos.reduce((acc, e) => acc + e.valorComprometido, 0);
    const livre = validos.reduce((acc, e) => acc + Math.max(0, e.saldoDisponivel), 0);
    const liquidado = validos.reduce((acc, e) => acc + e.valorLiquidado, 0);
    const aLiquidar = validos.reduce((acc, e) => acc + Math.max(0, e.saldoALiquidar), 0);
    const pct = (v: number) => (empenhado > 0 ? Math.round((v / empenhado) * 100) : 0);

    return [
      {
        key: "empenhado",
        label: "Empenhado",
        value: formatCurrency(empenhado),
        hint: `${validos.length} ${validos.length === 1 ? "empenho" : "empenhos"} · ${ativos} ${ativos === 1 ? "ativo" : "ativos"}`,
      },
      {
        key: "os",
        label: "Destinado a OS",
        value: formatCurrency(emOs),
        hint: `${formatCurrency(livre)} livres para novas OS`,
      },
      { key: "liquidado", label: "Liquidado", value: formatCurrency(liquidado), hint: `${pct(liquidado)}% do empenhado` },
      { key: "saldo", label: "A liquidar", value: formatCurrency(aLiquidar), hint: "do valor empenhado", tone: "primary" },
    ];
  }, [filteredEmpenhos]);

  const handleOpen = (empenho?: EmpenhoList) => {
    setEditingEmpenho(empenho || null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingEmpenho(null);
  };

  const handleOpenDelete = (empenho: EmpenhoList) => {
    setEmpenhoToDelete(empenho);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setEmpenhoToDelete(null);
  };

  const handleSave = () => {
    handleClose();
  };

  const { canEditAdministrativo } = usePermission();

  return (
    <div className="p-4 md:p-5 max-w-7xl mx-auto">
      <PageHeader
        icon={Layers2}
        title="Empenhos"
        canAct={canEditAdministrativo}
        actionLabel="Novo Empenho"
        onAction={() => handleOpen()}
      />

      {/* Sem overflow-hidden: o painel de filtros precisa sair do card */}
      <div className="bg-surface border border-border rounded-lg">
        <SummaryStrip cells={summaryCells} className="rounded-t-lg" />
        <div className="px-4 pt-3 pb-3 border-b border-border space-y-2">
          <EmpenhoFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            scopeOptions={scopeOptions}
            scope={activeScope}
            onScopeChange={setScope}
          />
          <FilterSummary
            count={filteredEmpenhos.length}
            searchTerm={searchTerm}
            chips={scopeChips(activeScope, scopeOptions, setScope)}
            onClear={() => {
              setSearchTerm("");
              setScope(EMPTY_SCOPE);
            }}
          />
        </div>
        <div className="rounded-b-lg overflow-hidden">
          <EmpenhoTable
            key={`${searchTerm}|${scopeKey}`}
            empenhos={filteredEmpenhos}
            isLoading={isListLoading}
            onEdit={handleOpen}
            onDelete={handleOpenDelete}
            onAdd={() => handleOpen()}
          />
        </div>
      </div>

      {isOpen && (
        <EmpenhoModal
          isOpen={isOpen}
          empenho={editingEmpenho}
          handleClose={handleClose}
          handleSubmit={handleSave}
        />
      )}

      {isDeleteOpen && empenhoToDelete && (
        <DeleteEmpenhoModal
          isOpen={isDeleteOpen}
          empenho={empenhoToDelete}
          handleClose={handleCloseDelete}
        />
      )}
    </div>
  );
}
