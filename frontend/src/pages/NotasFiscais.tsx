import { useEffect, useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import { useInvoice, type Invoice } from "../store/invoices";
import { AddModal } from "./NotaFiscal/AddModal";
import NotaFiscalTable from "./NotaFiscal/NotaFiscalTable";
import { DeleteModal } from "./NotaFiscal/DeleteModal";
import StatusCards from "./NotaFiscal/StatusCards";
import Header from "./NotaFiscal/Header";
import EditModal from "./NotaFiscal/EditModal";

export default function NotasFiscais() {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);

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
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {editInvoice && (
        <EditModal editInvoice={editInvoice} setEditInvoice={setEditInvoice} />
      )}
      {/* Breadcrumb */}
      <Breadcrumb current="Notas Fiscais" />

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

      {/* Filters FAZER */}
      {/* <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Buscar por número, cliente ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-surface-muted transition-colors text-sm text-text-secondary">
          <Filter size={16} />
          Filtros
        </button>
      </div> */}

      {/* Table */}
      <NotaFiscalTable
        allInvoices={allInvoices}
        setDeleteInvoice={setDeleteInvoice}
        setEditInvoice={setEditInvoice}
      />

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
