import { useState } from "react";
import {
  X,
  Receipt,
  Hash,
  Building2,
  Link2,
  AlignLeft,
  CalendarDays,
  Wallet,
} from "lucide-react";
import type { Invoice, InvoiceFormData } from "./types";

interface EditModalProps {
  isOpen: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (id: string, data: Partial<Invoice>) => void;
}

export function EditModal({
  isOpen,
  invoice,
  onClose,
  onSave,
}: EditModalProps) {
  const [formData, setFormData] = useState({
    numero: invoice?.numero || "",
    description: invoice?.description || "",
    vencimento: invoice?.vencimento || "",
    value: invoice?.value?.toString() || "",
    empenho_id: invoice?.empenho_id || "",
    company_id: invoice?.company_id || "",
    status: invoice?.status || "pending",
  });

  if (!isOpen || !invoice) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.numero || !formData.value || !formData.vencimento || !invoice)
      return;

    onSave(invoice.id, {
      numero: formData.numero,
      description: formData.description,
      vencimento: formData.vencimento,
      value: parseFloat(formData.value),
      empenho_id: formData.empenho_id,
      company_id: formData.company_id,
      status: formData.status,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-linear-to-r from-primary-50/50 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Receipt size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Editar Nota Fiscal
              </h2>
              <p className="text-sm text-text-secondary">
                Atualize os dados da NF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-muted rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Identificação */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Hash size={16} className="text-primary-500" />
              <span>Identificação</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Número da NF <span className="text-danger-text">*</span>
                </label>
                <div className="relative">
                  <Hash
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    required
                    value={formData.numero}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, numero: e.target.value }))
                    }
                    placeholder="NF-2024-001"
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Valor <span className="text-danger-text">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium">
                    R$
                  </span>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, value: e.target.value }))
                    }
                    placeholder="0,00"
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cliente e Empenho */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Building2 size={16} className="text-primary-500" />
              <span>Cliente e Empenho</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Cliente
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    value={formData.company_id}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, company_id: e.target.value }))
                    }
                    placeholder="Nome da empresa"
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Link2 size={14} />
                    Empenho
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={formData.empenho_id}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, empenho_id: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 appearance-none cursor-pointer"
                  >
                    <option value="">Selecione um empenho...</option>
                    <option value="EMP-2024-001">EMP-2024-001</option>
                    <option value="EMP-2024-002">EMP-2024-002</option>
                    <option value="EMP-2024-003">EMP-2024-003</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-text-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <AlignLeft size={16} className="text-primary-500" />
              <span>Descrição</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Descreva os serviços ou produtos..."
                rows={3}
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
              />
            </div>
          </div>

          {/* Datas e Status */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <CalendarDays size={16} className="text-primary-500" />
              <span>Datas e Status</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Vencimento <span className="text-danger-text">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.vencimento}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, vencimento: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Wallet size={14} />
                    Status
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        status: e.target.value as InvoiceFormData["status"],
                      }))
                    }
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 appearance-none cursor-pointer"
                  >
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="overdue">Vencido</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-text-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-text-secondary hover:bg-surface-muted rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
