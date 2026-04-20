import { useEffect, useState } from "react";
import {
  Plus,
  DollarSign,
  Search,
  Filter,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import Breadcrumb from "../components/Breadcrumb";
import { useInvoice, type Invoice } from "../store/invoices";
import { AddModal } from "./NotaFiscal/AddModal";
import NotaFiscalTable from "./NotaFiscal/NotaFiscalTable";
import { DeleteModal } from "./NotaFiscal/DeleteModal";

export default function NotasFiscais() {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
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

  // Funções de manipulação
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb current="Notas Fiscais" />

      {/* Header FAZER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="text-primary-500" />
            Notas Fiscais
          </h1>
          <div className="flex items-center mt-1">
            <p className="text-text-secondary text-sm">
              Gerencie as notas fiscais emitidas e acompanhe os pagamentos
            </p>

            <span className="text-text-muted">|</span>
            <div className="flex items-center gap-1.5 text-sm">
              <DollarSign size={14} className="text-accent-500" />
              <span className="text-text-secondary">
                Valor total em NF emitidas:
              </span>
              <span className="font-semibold text-text-primary">
                {formatCurrency(totalValue)}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Nova NF
        </button>
      </div>

      {/* Stats Cards FAZER*/}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total de NFs"
          value={totalCount.toString()}
          subtitle="Emitidas"
          icon={<FileText size={24} className="text-primary-500" />}
          color="bg-primary-100"
        />
        <StatCard
          title="NFs pendentes"
          value={pendingInvoices.toString()}
          subtitle={formatCurrency(pendingValue)}
          icon={<Clock size={24} className="text-warning-text" />}
          color="bg-warning-bg"
        />
        <StatCard
          title="Pagas"
          value={paidInvoices.toString()}
          subtitle={formatCurrency(paidValue)}
          icon={<CheckCircle2 size={24} className="text-success-text" />}
          color="bg-success-bg"
        />
        <StatCard
          title="Vencidas"
          value={expiredCount.toString()}
          subtitle={formatCurrency(expiredValue)}
          icon={<XCircle size={24} className="text-danger-text" />}
          color="bg-danger-bg"
        />
      </div>

      {/* Filters FAZER */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
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
      </div>

      {/* Table */}
      <NotaFiscalTable
        allInvoices={allInvoices}
        setDeleteInvoice={setDeleteInvoice}
      />

      {/* Modal - Cadastrar (AddModal com integração de empresas e empenhos) */}
      <AddModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={() => {
          // Recarregar dados após criação
          console.log("Nota fiscal criada com sucesso");
        }}
      />

      {deleteInvoice && (
        <DeleteModal
          deleteInvoice={deleteInvoice}
          setDeleteInvoice={setDeleteInvoice}
        />
      )}
    </div>
  );
}
