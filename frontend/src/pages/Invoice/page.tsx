import { useEffect, useState, useMemo } from "react";
import { useInvoice } from "../../store/invoices";
import type { Invoice } from "../../../types/invoice";
import {
  AddModal,
  InvoiceTable,
  DeleteModal,
  StatusCards,
  Header,
  EditModal,
  InvoiceFilters,
} from "./index";

export default function Invoices() {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  useEffect(() => {
    list();
  }, [list]);

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return allInvoices;
    const s = searchTerm.toLowerCase();
    return allInvoices.filter(
      (inv) =>
        inv.numero.toLowerCase().includes(s) ||
        inv.description.toLowerCase().includes(s) ||
        (inv.company?.name ?? "").toLowerCase().includes(s),
    );
  }, [allInvoices, searchTerm]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {editInvoice && (
        <EditModal editInvoice={editInvoice} setEditInvoice={setEditInvoice} />
      )}
      {/* Header */}
      <Header totalValue={totalValue} setIsOpen={setIsOpen} />

      {/* Stats Cards */}
      <StatusCards
        totalCount={totalCount}
        paidInvoices={paidInvoices}
        paidValue={paidValue}
        expiredCount={expiredCount}
        pendingInvoices={pendingInvoices}
        pendingValue={pendingValue}
        expiredValue={expiredValue}
      />

      {/* Filters + Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-border">
          <InvoiceFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          {searchTerm && (
            <p className="text-xs text-text-muted mt-2">
              {filteredInvoices.length} resultado
              {filteredInvoices.length !== 1 ? "s" : ""} para "{searchTerm}"
            </p>
          )}
        </div>
        <InvoiceTable
          allInvoices={filteredInvoices}
          setDeleteInvoice={setDeleteInvoice}
          setEditInvoice={setEditInvoice}
        />
      </div>

      {/* Modal - Cadastrar (AddModal com integração de empresas e empenhos) */}
      {isOpen && <AddModal isOpen={isOpen} setIsOpen={setIsOpen} />}

      {deleteInvoice && (
        <DeleteModal
          deleteInvoice={deleteInvoice}
          setDeleteInvoice={setDeleteInvoice}
        />
      )}
    </div>
  );
}
