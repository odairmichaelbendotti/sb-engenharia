import { useState } from "react";
import { Header } from "./Header";
import { StatusCards } from "./StatusCards";
import { NotaFiscalTable } from "./NotaFiscalTable";
import { AddModal } from "./AddModal";
import { EditModal } from "./EditModal";
import { DeleteModal } from "./DeleteModal";
import type { NotaFiscal } from "../../../types/notaFiscal";

const mockInvoices: NotaFiscal[] = [
  {
    id: "1",
    numero: "NF-2024-001",
    description: "Serviços de consultoria",
    vencimento: "2024-02-15",
    value: 15250.0,
    empenho_id: "EMP-2024-001",
    company_id: "Construtora Silva Ltda",
    status: "paid",
    client: "Construtora Silva Ltda",
    date: "2024-01-15",
  },
  {
    id: "2",
    numero: "NF-2024-002",
    description: "Desenvolvimento de software",
    vencimento: "2024-02-18",
    value: 8900.5,
    empenho_id: "EMP-2024-002",
    company_id: "Engenharia Santos S.A.",
    status: "pending",
    client: "Engenharia Santos S.A.",
    date: "2024-01-18",
  },
  {
    id: "3",
    numero: "NF-2024-003",
    description: "Fornecimento de produtos",
    vencimento: "2024-02-20",
    value: 22500.0,
    empenho_id: "EMP-2024-003",
    company_id: "Obras Rápidas ME",
    status: "overdue",
    client: "Obras Rápidas ME",
    date: "2024-01-20",
  },
  {
    id: "4",
    numero: "NF-2024-004",
    description: "Campanha publicitária",
    vencimento: "2024-02-22",
    value: 5600.0,
    empenho_id: "EMP-2024-004",
    company_id: "Fundação Forte EPP",
    status: "pending",
    client: "Fundação Forte EPP",
    date: "2024-01-22",
  },
  {
    id: "5",
    numero: "NF-2024-005",
    description: "Serviços de transporte",
    vencimento: "2024-02-25",
    value: 12300.0,
    empenho_id: "EMP-2024-005",
    company_id: "Estrutura Primavera",
    status: "paid",
    client: "Estrutura Primavera",
    date: "2024-01-25",
  },
];

export default function NotaFiscal() {
  const [invoices, setInvoices] = useState<NotaFiscal[]>(mockInvoices);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<NotaFiscal | null>(
    null,
  );

  function handleAdd(data: Omit<NotaFiscal, "id">) {
    const newInvoice: NotaFiscal = {
      ...data,
      id: crypto.randomUUID(),
      client: data.company_id,
      date: new Date().toISOString().split("T")[0],
    };
    setInvoices((prev) => [...prev, newInvoice]);
    setIsAddOpen(false);
  }

  function handleEdit(invoice: NotaFiscal) {
    setSelectedInvoice(invoice);
    setIsEditOpen(true);
  }

  function handleSaveEdit(id: string, data: Partial<NotaFiscal>) {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...data } : inv)),
    );
    setIsEditOpen(false);
    setSelectedInvoice(null);
  }

  function handleDeleteClick(invoice: NotaFiscal) {
    setSelectedInvoice(invoice);
    setIsDeleteOpen(true);
  }

  function handleConfirmDelete() {
    if (selectedInvoice) {
      setInvoices((prev) =>
        prev.filter((inv) => inv.id !== selectedInvoice.id),
      );
      setIsDeleteOpen(false);
      setSelectedInvoice(null);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <Header onAddClick={() => setIsAddOpen(true)} />
      <StatusCards invoices={invoices} />
      <NotaFiscalTable
        invoices={invoices}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <AddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAdd}
      />

      <EditModal
        key={selectedInvoice?.id || "new"}
        isOpen={isEditOpen}
        invoice={selectedInvoice}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedInvoice(null);
        }}
        onSave={handleSaveEdit}
      />

      <DeleteModal
        isOpen={isDeleteOpen}
        invoice={selectedInvoice}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedInvoice(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
