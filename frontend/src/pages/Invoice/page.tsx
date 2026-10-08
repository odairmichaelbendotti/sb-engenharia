import { useEffect, useState, useMemo } from "react";
import { useInvoice } from "../../store/invoices";
import type { Invoice, InvoiceStatus } from "../../../types/invoice";
import { AddModal, InvoiceTable, DeleteModal, EditModal, InvoiceFilters } from "./index";
import { PageHeader } from "../../components/PageHeader";
import { SummaryStrip, type SummaryCell } from "../../components/SummaryStrip";
import { matchesScope, resolveScope, scopeChips, type ScopeRef } from "../../components/filters/scope-options";
import { FilterSummary } from "../../components/filters/FilterSummary";
import { usePermission } from "../../hooks/usePermission";
import { EMPTY_SCOPE, useScopeFilter } from "../../hooks/useScopeFilter";
import { formatCurrency } from "../../utils/format-currency";
import { FileText } from "lucide-react";

// "" = todas as notas
type InvoiceStatusFilter = Exclude<InvoiceStatus, "CANCELADO"> | "";

const STATUS_FILTER_LABEL: Record<Exclude<InvoiceStatusFilter, "">, string> = {
  PENDENTE: "pendentes",
  PAGO: "pagas",
  VENCIDO: "vencidas",
};

// A nota tem uma origem só: a empresa e o empenho (com o contrato dele)
function invoiceScopeRefs(inv: Invoice): ScopeRef[] {
  if (!inv.empenho) return [];
  return [
    {
      empresa: { id: inv.company?.id ?? "", name: inv.company?.name ?? "" },
      contrato: inv.empenho.contrato ?? null,
      empenho: { id: inv.empenho.id, numero: inv.empenho.numero },
    },
  ];
}

const plural = (n: number) => `${n} ${n === 1 ? "nota" : "notas"}`;

export default function Invoices() {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("");
  const [scope, setScope] = useScopeFilter();

  const { list, allInvoices } = useInvoice();
  const { canEditAdministrativo } = usePermission();

  useEffect(() => {
    list();
  }, [list]);

  // Valor escolhido em outra tela que não existe aqui é ignorado
  const { options: scopeOptions, active: activeScope } = useMemo(
    () => resolveScope(allInvoices, invoiceScopeRefs, scope),
    [allInvoices, scope],
  );
  const scopeKey = `${activeScope.empresa}|${activeScope.contrato}|${activeScope.empenho}`;

  // Notas no recorte e na busca, antes do filtro de status: base dos totais
  const scopedInvoices = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return allInvoices.filter((inv) => {
      if (!matchesScope(invoiceScopeRefs(inv), activeScope)) return false;
      if (!s) return true;
      return (
        inv.numero.toLowerCase().includes(s) ||
        inv.description.toLowerCase().includes(s) ||
        (inv.company?.name ?? "").toLowerCase().includes(s) ||
        (inv.empenho?.numero.toLowerCase().includes(s) ?? false) ||
        (inv.ordemServico?.numero.toLowerCase().includes(s) ?? false) ||
        (inv.obra?.nome.toLowerCase().includes(s) ?? false)
      );
    });
  }, [allInvoices, searchTerm, activeScope]);

  const filteredInvoices = useMemo(
    () => (statusFilter ? scopedInvoices.filter((inv) => inv.status?.toUpperCase() === statusFilter) : scopedInvoices),
    [scopedInvoices, statusFilter],
  );

  // Totais por situação, no recorte da tela; cada célula também filtra a tabela
  const summaryCells = useMemo<SummaryCell[]>(() => {
    const sum = (status?: string) => {
      const list = scopedInvoices.filter((inv) =>
        status ? inv.status?.toUpperCase() === status : inv.status?.toUpperCase() !== "CANCELADO",
      );
      return { count: list.length, value: list.reduce((acc, inv) => acc + inv.value, 0) };
    };
    const all = sum();
    const cell = (
      key: InvoiceStatusFilter,
      label: string,
      tone: SummaryCell["tone"],
      totals: { count: number; value: number },
    ): SummaryCell => ({
      key: key || "ALL",
      label,
      value: formatCurrency(totals.value),
      hint: plural(totals.count),
      tone: totals.count > 0 ? tone : "default",
      onClick: () => setStatusFilter(statusFilter === key ? "" : key),
      active: statusFilter === key && key !== "",
    });

    return [
      { ...cell("", "Liquidado em NFs", "default", all), hint: `${plural(all.count)} (sem canceladas)` },
      cell("PENDENTE", "Pendentes", "warning", sum("PENDENTE")),
      cell("PAGO", "Pagas", "success", sum("PAGO")),
      cell("VENCIDO", "Vencidas", "danger", sum("VENCIDO")),
    ];
  }, [scopedInvoices, statusFilter]);

  return (
    <div className="p-4 md:p-5 max-w-7xl mx-auto">
      {editInvoice && <EditModal editInvoice={editInvoice} setEditInvoice={setEditInvoice} />}

      <PageHeader
        icon={FileText}
        title="Notas Fiscais"
        canAct={canEditAdministrativo}
        actionLabel="Nova Nota Fiscal"
        onAction={() => setIsOpen(true)}
      />

      {/* Sem overflow-hidden: o painel de filtros precisa sair do card */}
      <div className="bg-surface border border-border rounded-lg">
        <SummaryStrip cells={summaryCells} className="rounded-t-lg" />
        <div className="px-4 pt-3 pb-3 border-b border-border space-y-2">
          <InvoiceFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            scopeOptions={scopeOptions}
            scope={activeScope}
            onScopeChange={setScope}
          />
          <FilterSummary
            count={filteredInvoices.length}
            searchTerm={searchTerm}
            chips={scopeChips(activeScope, scopeOptions, setScope)}
            extra={statusFilter ? STATUS_FILTER_LABEL[statusFilter] : undefined}
            onClear={() => {
              setSearchTerm("");
              setStatusFilter("");
              setScope(EMPTY_SCOPE);
            }}
          />
        </div>
        <div className="rounded-b-lg overflow-hidden">
          {/* key reinicia a paginação quando os filtros mudam */}
          <InvoiceTable
            key={`${searchTerm}|${scopeKey}|${statusFilter}`}
            allInvoices={filteredInvoices}
            setDeleteInvoice={setDeleteInvoice}
            setEditInvoice={setEditInvoice}
          />
        </div>
      </div>

      {isOpen && <AddModal isOpen={isOpen} setIsOpen={setIsOpen} />}

      {deleteInvoice && <DeleteModal deleteInvoice={deleteInvoice} setDeleteInvoice={setDeleteInvoice} />}
    </div>
  );
}
