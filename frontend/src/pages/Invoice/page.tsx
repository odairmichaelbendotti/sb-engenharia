import { useEffect, useState, useMemo } from "react";
import { useInvoice } from "../../store/invoices";
import type { Invoice } from "../../../types/invoice";
import {
  AddModal,
  InvoiceTable,
  DeleteModal,
  StatusCards,
  EditModal,
  InvoiceFilters,
} from "./index";
import type { InvoiceStatusFilter } from "./StatusCards";
import { PageHeader } from "../../components/PageHeader";
import { buildEmpenhoOptions } from "../../components/filters/empenho-options";
import { FilterSummary } from "../../components/filters/FilterSummary";
import { usePermission } from "../../hooks/usePermission";
import { useEmpenhoFilter } from "../../hooks/useEmpenhoFilter";
import { FileText } from "lucide-react";

const STATUS_FILTER_LABEL: Record<Exclude<InvoiceStatusFilter, "">, string> = {
  PENDENTE: "pendentes",
  PAGO: "pagas",
  VENCIDO: "vencidas",
};

export default function Invoices() {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("");
  const [empenhoId, setEmpenhoId] = useEmpenhoFilter();

  const {
    list,
    totalCount,
    totalValue,
    paidInvoices,
    paidValue,
    expiredCount,
    expiredValue,
    pendingInvoices,
    pendingValue,
    allInvoices,
  } = useInvoice();

  const { canEditAdministrativo } = usePermission();

  useEffect(() => {
    list();
  }, [list]);

  const empenhoOptions = useMemo(
    () =>
      buildEmpenhoOptions(allInvoices, (inv) =>
        inv.empenho ? [{ id: inv.empenho.id, numero: inv.empenho.numero, companyName: inv.company?.name ?? "" }] : [],
      ),
    [allInvoices],
  );

  // Empenho que não tem nota (ex.: escolhido em outra tela) não filtra esta lista
  const activeEmpenhoId = empenhoOptions.some((e) => e.id === empenhoId) ? empenhoId : "";

  const filteredInvoices = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return allInvoices.filter((inv) => {
      if (activeEmpenhoId && inv.empenho_id !== activeEmpenhoId) return false;
      if (statusFilter && inv.status?.toUpperCase() !== statusFilter) return false;
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
  }, [allInvoices, searchTerm, activeEmpenhoId, statusFilter]);

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

      {/* Cards de status também filtram a tabela */}
      <StatusCards
        totalCount={totalCount}
        totalValue={totalValue}
        paidInvoices={paidInvoices}
        paidValue={paidValue}
        expiredCount={expiredCount}
        pendingInvoices={pendingInvoices}
        pendingValue={pendingValue}
        expiredValue={expiredValue}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 pt-3 pb-3 border-b border-border space-y-2">
          <InvoiceFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            empenhoOptions={empenhoOptions}
            empenhoId={activeEmpenhoId}
            onEmpenhoChange={setEmpenhoId}
          />
          <FilterSummary
            count={filteredInvoices.length}
            searchTerm={searchTerm}
            empenhoNumero={empenhoOptions.find((e) => e.id === activeEmpenhoId)?.numero}
            extra={statusFilter ? STATUS_FILTER_LABEL[statusFilter] : undefined}
            onClear={() => {
              setSearchTerm("");
              setStatusFilter("");
              setEmpenhoId("");
            }}
          />
        </div>
        {/* key reinicia a paginação quando os filtros mudam */}
        <InvoiceTable
          key={`${searchTerm}|${activeEmpenhoId}|${statusFilter}`}
          allInvoices={filteredInvoices}
          setDeleteInvoice={setDeleteInvoice}
          setEditInvoice={setEditInvoice}
        />
      </div>

      {isOpen && <AddModal isOpen={isOpen} setIsOpen={setIsOpen} />}

      {deleteInvoice && <DeleteModal deleteInvoice={deleteInvoice} setDeleteInvoice={setDeleteInvoice} />}
    </div>
  );
}
