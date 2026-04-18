import { useState } from "react";
import { toast } from "sonner";
import { estadosBrasil } from "../../utils/estados-brasil";
import {
  Loader2,
  X,
  Building2,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  MapPinned,
  Hash,
} from "lucide-react";
import type { Empresa } from "../../../types/empresa";
import { useCompanies } from "../../store/companies";
import type { CreateCompanyType } from "../../../types/create-company";

type RegisterOrEditCompanyProps = {
  isOpen: boolean;
  handleClose: () => void;
  empresaSelecionada: Empresa | null;
  formData: CreateCompanyType;
  setFormData: React.Dispatch<React.SetStateAction<CreateCompanyType>>;
};

const RegisterOrEditCompany = ({
  isOpen,
  handleClose,
  empresaSelecionada,
  formData,
  setFormData,
}: RegisterOrEditCompanyProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { createCompany, updateCompany, findCep } = useCompanies();

  async function handleFindCep() {
    try {
      const response = await findCep(formData.cep);
      if (response) {
        setFormData({
          ...formData,
          address: response.logradouro,
          city: response.localidade,
          state: response.uf,
        });
        return;
      }
      setFormData({
        ...formData,
        address: "",
        city: "",
        state: "",
      });
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      if (empresaSelecionada) {
        const updatedCompany = await updateCompany(
          empresaSelecionada.id,
          formData,
        );
        console.log(updatedCompany);
        toast.success("Empresa editada com sucesso");
      } else {
        const newCompany = await createCompany(formData);
        console.log(newCompany);
        toast.success("Empresa cadastrada com sucesso");
      }
    } catch (error) {
      console.log(error);
      toast.error("Erro ao cadastrar empresa");
    } finally {
      setIsLoading(false);
    }

    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-linear-to-r from-primary-50/50 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {empresaSelecionada ? "Editar Empresa" : "Nova Empresa"}
              </h2>
              <p className="text-sm text-text-secondary">
                {empresaSelecionada
                  ? "Atualize os dados da empresa"
                  : "Preencha os dados para cadastrar uma nova empresa"}
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

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Seção: Dados da Empresa */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Building size={16} className="text-primary-500" />
              <span>Dados da Empresa</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Nome da Empresa <span className="text-danger-text">*</span>
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                    placeholder="Ex: Construtora Silva Ltda"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  CNPJ <span className="text-danger-text">*</span>
                </label>
                <div className="relative">
                  <FileText
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    required
                    value={formData.cnpj}
                    onChange={(e) =>
                      setFormData({ ...formData, cnpj: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                    placeholder="contato@empresa.com.br"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Telefone
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Endereço */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <MapPin size={16} className="text-primary-500" />
              <span>Endereço</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  CEP
                </label>
                <div className="relative">
                  <Hash
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    value={formData.cep}
                    onBlur={handleFindCep}
                    onChange={(e) =>
                      setFormData({ ...formData, cep: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                    placeholder="00000-000"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Endereço
                </label>
                <div className="relative">
                  <MapPinned
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                    placeholder="Rua, número, bairro"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Cidade
                </label>
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                    placeholder="Ex: São Paulo"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Estado
                </label>
                <div className="relative">
                  <select
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Selecione</option>
                    {estadosBrasil.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
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
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : empresaSelecionada ? (
                "Salvar Alterações"
              ) : (
                "Cadastrar Empresa"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterOrEditCompany;
