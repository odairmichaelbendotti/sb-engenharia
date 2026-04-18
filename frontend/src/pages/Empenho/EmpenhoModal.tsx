import { Loader, X } from "lucide-react";
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-text-primary">
            {empenho ? "Editar Empenho" : "Novo Empenho"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-surface-muted rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <form className="p-4 overflow-y-auto" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Número do Empenho *
              </label>
              <input
                type="text"
                name="numero"
                value={formState.numero}
                onChange={handleChange}
                placeholder="NE2028003"
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Valor *
              </label>
              <input
                type="text"
                name="value"
                value={formState.value}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Empresa *
              </label>
              <select
                name="company_id"
                value={formState.company_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">Selecione uma empresa</option>
                {companies.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.name} - {empresa.cnpj}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Descrição
              </label>
              <textarea
                name="description"
                value={formState.description}
                onChange={handleChange}
                placeholder="Descrição do empenho e serviços contratados"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Data do Empenho
              </label>
              <input
                type="date"
                name="startAt"
                value={formState.startAt}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Data Limite
              </label>
              <input
                type="date"
                name="endAt"
                value={formState.endAt}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            {/* <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="ativo">Ativo</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div> */}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-5 border-border shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 cursor-pointer py-2 text-text-secondary hover:bg-surface-muted rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center w-40 py-2 cursor-pointer bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              {isLoading ? (
                <Loader className="animate-spin" />
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
