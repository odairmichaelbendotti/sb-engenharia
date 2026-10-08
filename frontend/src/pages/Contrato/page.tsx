import { useState, useMemo, useEffect } from "react";
import { useContratos } from "../../store/contratos";
import type { Contrato } from "../../../types/contrato";
import { ContratoFilters, ContratoTable, ContratoModal, DeleteContratoModal } from "./index";
import { formatCurrency } from "../../utils/format-currency";
import { usePermission } from "../../hooks/usePermission";
import { EMPTY_SCOPE, useScopeFilter } from "../../hooks/useScopeFilter";
import { PageHeader } from "../../components/PageHeader";
import { SummaryStrip, type SummaryCell } from "../../components/SummaryStrip";
import { matchesScope, resolveScope, scopeChips, type ScopeRef } from "../../components/filters/scope-options";
import { FilterSummary } from "../../components/filters/FilterSummary";
import { FileSignature } from "lucide-react";

// Contrato filtra por empresa e por ele mesmo (o nível de empenho não se aplica)
function contratoScopeRefs(contrato: Contrato): ScopeRef[] {
  return [
    {
      empresa: { id: contrato.company.id, name: contrato.company.name },
      contrato: { id: contrato.id, identificador: contrato.identificador },
      empenho: null,
    },
  ];
}

export default function Contratos() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [contratoToDelete, setContratoToDelete] = useState<Contrato | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isListLoading, setIsListLoading] = useState(true);
  const [scope, setScope] = useScopeFilter();

  const { fetchContratos, data } = useContratos();

  const contratos = useMemo(() => data?.contratos || [], [data]);

  // Valor escolhido em outra tela que não existe aqui é ignorado
  const { options: scopeOptions, active: activeScope } = useMemo(
    () => resolveScope(contratos, contratoScopeRefs, scope),
    [contratos, scope],
  );
  const scopeKey = `${activeScope.empresa}|${activeScope.contrato}|${activeScope.empenho}`;

  const filteredContratos = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return contratos.filter(
      (contrato) =>
        matchesScope(contratoScopeRefs(contrato), activeScope) &&
        (!s ||
          contrato.identificador.toLowerCase().includes(s) ||
          contrato.descricaoCurta.toLowerCase().includes(s) ||
          contrato.company?.name.toLowerCase().includes(s)),
    );
  }, [contratos, searchTerm, activeScope]);

  useEffect(() => {
    fetchContratos().finally(() => setIsListLoading(false));
  }, [fetchContratos]);

  // Totais dos contratos que passam pelos filtros (cancelados não entram nos valores)
  const summaryCells = useMemo<SummaryCell[]>(() => {
    const validos = filteredContratos.filter((c) => c.status !== "CANCELADO");
    const ativos = validos.filter((c) => c.status === "ATIVO").length;
    const contratado = validos.reduce((acc, c) => acc + c.valor, 0);
    const empenhado = validos.reduce((acc, c) => acc + c.valorEmpenhado, 0);
    const liquidado = validos.reduce((acc, c) => acc + c.valorLiquidado, 0);
    const aEmpenhar = validos.reduce((acc, c) => acc + Math.max(0, c.saldoDisponivel), 0);
    const aLiquidar = validos.reduce((acc, c) => acc + Math.max(0, c.saldoALiquidar), 0);
    const pct = (v: number) => (contratado > 0 ? Math.round((v / contratado) * 100) : 0);

    return [
      {
        key: "contratado",
        label: "Contratado",
        value: formatCurrency(contratado),
        hint: `${validos.length} ${validos.length === 1 ? "contrato" : "contratos"} · ${ativos} ${ativos === 1 ? "ativo" : "ativos"}`,
      },
      {
        key: "empenhado",
        label: "Empenhado",
        value: formatCurrency(empenhado),
        hint: `${pct(empenhado)}% · ${formatCurrency(aEmpenhar)} a empenhar`,
      },
      { key: "liquidado", label: "Liquidado", value: formatCurrency(liquidado), hint: `${pct(liquidado)}% do contratado` },
      { key: "saldo", label: "A liquidar", value: formatCurrency(aLiquidar), hint: "do valor contratado", tone: "primary" },
    ];
  }, [filteredContratos]);

  const handleOpen = (contrato?: Contrato) => {
    setEditingContrato(contrato || null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingContrato(null);
  };

  const handleOpenDelete = (contrato: Contrato) => {
    setContratoToDelete(contrato);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setContratoToDelete(null);
  };

  const { canEditAdministrativo } = usePermission();

  return (
    <div className="p-4 md:p-5 max-w-7xl mx-auto">
      <PageHeader
        icon={FileSignature}
        title="Contratos"
        canAct={canEditAdministrativo}
        actionLabel="Novo Contrato"
        onAction={() => handleOpen()}
      />

      {/* Sem overflow-hidden: o painel de filtros precisa sair do card */}
      <div className="bg-surface border border-border rounded-lg">
        <SummaryStrip cells={summaryCells} className="rounded-t-lg" />
        <div className="px-4 pt-3 pb-3 border-b border-border space-y-2">
          <ContratoFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            scopeOptions={scopeOptions}
            scope={activeScope}
            onScopeChange={setScope}
          />
          <FilterSummary
            count={filteredContratos.length}
            searchTerm={searchTerm}
            chips={scopeChips(activeScope, scopeOptions, setScope)}
            onClear={() => {
              setSearchTerm("");
              setScope(EMPTY_SCOPE);
            }}
          />
        </div>
        <div className="rounded-b-lg overflow-hidden">
          <ContratoTable
            key={`${searchTerm}|${scopeKey}`}
            contratos={filteredContratos}
            isLoading={isListLoading}
            onEdit={handleOpen}
            onDelete={handleOpenDelete}
            onAdd={() => handleOpen()}
          />
        </div>
      </div>

      {isOpen && <ContratoModal contrato={editingContrato} handleClose={handleClose} />}

      {isDeleteOpen && contratoToDelete && (
        <DeleteContratoModal
          isOpen={isDeleteOpen}
          contrato={contratoToDelete}
          handleClose={handleCloseDelete}
        />
      )}
    </div>
  );
}
