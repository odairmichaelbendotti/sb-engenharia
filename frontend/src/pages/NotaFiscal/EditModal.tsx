import { useState, useEffect } from "react";
import {
  X,
  Receipt,
  Hash,
  Building2,
  AlignLeft,
  CalendarDays,
  Wallet,
  CircleAlert,
  Banknote,
  Loader,
} from "lucide-react";
import type { Invoice } from "./types";
import { useCompanies } from "../../store/companies";
import type { Empenho } from "../../../types/empenho";
import { toast } from "sonner";
import { useInvoice } from "../../store/invoices";

interface EditModalProps {
  editInvoice: Invoice | null;
  setEditInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
}

export default function EditModal({
  editInvoice,
  setEditInvoice,
}: EditModalProps) {
  const [formData, setFormData] = useState({
    numero: "",
    description: "",
    vencimento: "",
    value: "",
    empenho_id: "",
    company_id: "",
    status: "pending",
  });
  const [empenhosByCompany, setEmpenhosByCompany] = useState<Empenho[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { companies } = useCompanies();
  const { update } = useInvoice();

  // Inicializa formData quando editInvoice muda
  useEffect(() => {
    if (editInvoice) {
      setFormData({
        numero: editInvoice.numero || "",
        description: editInvoice.description || "",
        vencimento: editInvoice.vencimento || "",
        value: editInvoice.value?.toString() || "",
        empenho_id: editInvoice.empenho_id || "",
        company_id: editInvoice.company_id || "",
        status: editInvoice.status?.toUpperCase() || "PENDING",
      });

      // Carrega empenhos da empresa selecionada
      const company = companies.find((c) => c.id === editInvoice.company_id);
      if (company) {
        setEmpenhosByCompany(company.empenhos);
      }
    }
  }, [editInvoice, companies]);

  function handleChangeCompany(companyId: string) {
    setFormData((f) => ({ ...f, company_id: companyId, empenho_id: "" }));
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      setEmpenhosByCompany(company.empenhos);
    } else {
      setEmpenhosByCompany([]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !formData.numero ||
      !formData.value ||
      !formData.vencimento ||
      !editInvoice
    )
      return;

    const nf = {
      numero: formData.numero,
      description: formData.description,
      vencimento: formData.vencimento,
      value: Number(formData.value),
      empenho_id: formData.empenho_id,
      company_id: formData.company_id,
      status: formData.status,
    };

    try {
      setIsLoading(true);
      await update(editInvoice.id, nf);
      toast.success("Nota fiscal atualizada com sucesso");
      setEditInvoice(null);
    } catch (error) {
      console.log("Error:", error);
      toast.error("Erro ao atualizar nota fiscal");
    } finally {
      setIsLoading(false);
    }
  }

  console.log(formData);

  if (!editInvoice) return null;

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
            title="Fechar"
            onClick={() => setEditInvoice(null)}
            className="p-2 cursor-pointer hover:bg-surface-muted rounded-lg transition-colors"
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
                  <select
                    value={formData.company_id}
                    onChange={(e) => handleChangeCompany(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 appearance-none cursor-pointer ${empenhosByCompany.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">Selecione a empresa</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Empenho
                </label>
                <div className="relative">
                  {!formData.company_id ? (
                    <CircleAlert
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    />
                  ) : (
                    <Banknote
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    />
                  )}
                  <select
                    disabled={!formData.company_id && true}
                    value={formData.empenho_id}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, empenho_id: e.target.value }))
                    }
                    className={`w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 appearance-none cursor-pointer ${empenhosByCompany.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">
                      {!formData.company_id
                        ? "Primeiro selecione a empresa"
                        : "Selecione um empenho"}
                    </option>
                    {empenhosByCompany.map((empenho) => (
                      <option key={empenho.id} value={empenho.id}>
                        {empenho.numero} - {empenho.description}
                      </option>
                    ))}
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
                  value={formData.vencimento.split("T")[0]}
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
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 appearance-none cursor-pointer"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGO">Pago</option>
                    <option value="VENCIDO">Vencido</option>
                    <option value="CANCELADO">Cancelado</option>
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
              title="Cancelar"
              onClick={() => setEditInvoice(null)}
              className="px-5 cursor-pointer py-2.5 text-text-secondary hover:bg-surface-muted rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              title="Salvar"
              type="submit"
              disabled={isLoading}
              className="px-5 cursor-pointer py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <Loader className="animate-spin" />
              ) : (
                "Salvar Alterações"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
