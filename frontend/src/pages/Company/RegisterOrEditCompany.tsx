import { useState } from "react";
import { toast } from "sonner";
import { estadosBrasil } from "../../utils/estados-brasil";
import { Loader2, X } from "lucide-react";
import type { Empresa } from "../../../types/empresa";
import { useCompanies } from "../../store/companies";
import type { CreateCompanyType } from "../../../types/create-company";

type RegisterOrEditCompanyProps = {
  closeModal: () => void;
  empresaSelecionada: Empresa | null;
  formData: CreateCompanyType;
  setFormData: React.Dispatch<React.SetStateAction<CreateCompanyType>>;
};

const RegisterOrEditCompany = ({
  closeModal,
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

    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-text-primary">
            {empresaSelecionada ? "Editar Empresa" : "Nova Empresa"}
          </h2>
          <button
            onClick={closeModal}
            className="p-2 hover:bg-surface-muted rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Nome da Empresa *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Ex: Construtora Silva Ltda"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                CNPJ *
              </label>
              <input
                type="text"
                required
                value={formData.cnpj}
                onChange={(e) =>
                  setFormData({ ...formData, cnpj: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="E-mail do responsável"
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="w-full">
              <label
                className="block text-sm font-medium text-text-secondary mb-1"
                htmlFor="cep"
              >
                CEP
              </label>
              <input
                type="text"
                id="cep"
                value={formData.cep}
                onBlur={handleFindCep}
                onChange={(e) =>
                  setFormData({ ...formData, cep: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="00000-000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Endereço
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Rua, número, bairro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Ex: São Paulo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Estado
              </label>
              <select
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">Selecione</option>
                {estadosBrasil.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border shrink-0">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-text-secondary hover:bg-surface-muted rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-2 w-44 flex justify-center items-center bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
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
