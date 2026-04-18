import {
  Loader,
  X,
  Receipt,
  Hash,
  Building2,
  AlignLeft,
  CalendarDays,
} from "lucide-react";
import { useCompanies } from "../../store/companies";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { defaultFetch } from "../../services/api";
import { useEmpenhos } from "../../store/empenhos";
import type { EmpenhoList } from "../../../types/empenho";

interface EmpenhoModalProps {
  isOpen: boolean;
  empenho: EmpenhoList | null;
  handleClose: () => void;
  handleSubmit: () => void;
}

interface FormState {
  numero: string;
  description: string;
  startAt: string;
  endAt: string;
  value: string;
  company_id: string;
}

export function EmpenhoModal({
  isOpen,
  empenho,
  handleClose,
}: EmpenhoModalProps) {
  const { companies, listCompanies } = useCompanies();
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    numero: "",
    description: "",
    startAt: "",
    endAt: "",
    value: "",
    company_id: "",
  });

  const { fetchListEmpenhos } = useEmpenhos();

  useEffect(() => {
    if (isOpen && companies.length === 0) {
      listCompanies();
    }
  }, [isOpen, companies.length, listCompanies]);

  useEffect(() => {
    if (empenho) {
      const formatDate = (d: Date | string) =>
        (d instanceof Date ? d : new Date(d)).toISOString().split("T")[0];

      setFormState({
        numero: empenho.numero.toString(),
        description: empenho.description,
        startAt: formatDate(empenho.startAt),
        endAt: formatDate(empenho.endAt),
        value: empenho.value.toString(),
        company_id: empenho.company_id,
      });
    } else {
      setFormState({
        numero: "",
        description: "",
        startAt: "",
        endAt: "",
        value: "",
        company_id: "",
      });
    }
  }, [empenho]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!formState.numero || !formState.description || !formState.value) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!formState.company_id) {
      toast.error("Selecione uma empresa");
      return;
    }

    const numericValue = parseFloat(
      String(formState.value).replace(/\./g, "").replace(",", "."),
    );
    if (isNaN(numericValue) || numericValue <= 0) {
      toast.error("Valor deve ser um número válido maior que zero");
      return;
    }

    if (new Date(formState.startAt) > new Date(formState.endAt)) {
      toast.error("Data de início deve ser menor que a data de término");
      return;
    }

    try {
      setIsLoading(true);

      if (empenho) {
        const response = await defaultFetch(`/empenho/update/${empenho.id}`, {
          method: "PUT",
          body: JSON.stringify(formState),
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Erro ao atualizar empenho");
          throw new Error("Erro ao atualizar empenho");
        }

        await fetchListEmpenhos();
        toast.info(`Empenho ${data.numero} atualizado com sucesso!`);
      } else {
        const response = await defaultFetch("/empenho/create", {
          method: "POST",
          body: JSON.stringify(formState),
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Erro ao criar empenho");
          throw new Error("Erro ao criar empenho");
        }

        await fetchListEmpenhos();
        toast.info(`Empenho ${data.numero} criado com sucesso!`);
      }

      handleClose();
    } catch (error) {
      throw new Error("Erro no Empenho Modal" + error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;
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
                {empenho ? "Editar Empenho" : "Novo Empenho"}
              </h2>
              <p className="text-sm text-text-secondary">
                {empenho
                  ? "Atualize os dados do empenho"
                  : "Preencha os dados para criar um novo empenho"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-surface-muted rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <form className="p-6 overflow-y-auto space-y-6" onSubmit={handleSubmit}>
          {/* Seção: Identificação */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Hash size={16} className="text-primary-500" />
              <span>Identificação</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Número do Empenho <span className="text-danger-text">*</span>
                </label>
                <div className="relative">
                  <Hash
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    name="numero"
                    value={formState.numero}
                    onChange={handleChange}
                    placeholder="NE2028003"
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
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
                    type="text"
                    name="value"
                    value={formState.value}
                    onChange={handleChange}
                    placeholder="0,00"
                    step="0.01"
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Empresa */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Building2 size={16} className="text-primary-500" />
              <span>Empresa</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Empresa <span className="text-danger-text">*</span>
              </label>
              <div className="relative">
                <Building2
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <select
                  name="company_id"
                  value={formState.company_id}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Selecione uma empresa</option>
                  {companies.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.name} - {empresa.cnpj}
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

          {/* Seção: Descrição */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <AlignLeft size={16} className="text-primary-500" />
              <span>Descrição</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div>
              <textarea
                name="description"
                value={formState.description}
                onChange={handleChange}
                placeholder="Descreva o objeto do empenho e os serviços contratados..."
                rows={3}
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all resize-none"
              />
            </div>
          </div>

          {/* Seção: Período */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <CalendarDays size={16} className="text-primary-500" />
              <span>Período de Vigência</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Data do Empenho
                </label>
                <input
                  type="date"
                  name="startAt"
                  value={formState.startAt}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Data Limite
                </label>
                <input
                  type="date"
                  name="endAt"
                  value={formState.endAt}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-text-secondary hover:bg-surface-muted rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader className="animate-spin" size={18} />
              ) : empenho ? (
                "Salvar Alterações"
              ) : (
                "Criar Empenho"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
