import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
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
  }, []);

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

      {/* Filters + Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-border">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por número, empresa ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
            />
          </div>
        </div>
        <NotaFiscalTable
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
