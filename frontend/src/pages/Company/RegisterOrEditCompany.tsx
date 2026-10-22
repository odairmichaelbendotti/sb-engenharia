import { useState } from "react";
import { toast } from "sonner";
import { estadosBrasil } from "../../utils/estados-brasil";
import {
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
import { StepForm } from "../../components/StepForm";
import { Field, FormSection, Input, Modal, ModalHeader, Select } from "../../components/ui";
import { useCompanies } from "../../store/companies";
import type { CreateCompanyType } from "../../../types/create-company";
import { maskCnpj, maskPhone, maskCep, onlyDigits } from "../../utils/masks";
import { createBlurNormalizer, COMPANY_FIELD_RULES } from "../../utils/normalization/form-rules";

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
      const response = await findCep(onlyDigits(formData.cep));
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

  // Validação de cada etapa: devolve a mensagem do primeiro problema ou null
  const validateDados = () =>
    !formData.name.trim() || !onlyDigits(formData.cnpj) ? "Preencha o nome e o CNPJ da empresa" : null;

  const submit = async () => {
    const payload: CreateCompanyType = {
      ...formData,
      cnpj: onlyDigits(formData.cnpj),
      phone: onlyDigits(formData.phone),
      cep: onlyDigits(formData.cep),
    };

    try {
      setIsLoading(true);

      if (empresaSelecionada) {
        await updateCompany(empresaSelecionada.id, payload);
        toast.success("Empresa editada com sucesso");
      } else {
        await createCompany(payload);
        toast.success("Empresa cadastrada com sucesso");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao cadastrar empresa");
    } finally {
      setIsLoading(false);
    }

    handleClose();
  };

  if (!isOpen) return null;

  return (
    <Modal open size="xl">
      <ModalHeader
        icon={Building2}
        title={empresaSelecionada ? "Editar Empresa" : "Nova Empresa"}
        description={
          empresaSelecionada
            ? "Atualize os dados da empresa"
            : "Preencha os dados para cadastrar uma nova empresa"
        }
        onClose={handleClose}
      />

      <StepForm
        isEdit={empresaSelecionada !== null}
        isSubmitting={isLoading}
        submitLabel={empresaSelecionada ? "Salvar Alterações" : "Cadastrar Empresa"}
        onCancel={handleClose}
        onSubmit={submit}
        onBlur={createBlurNormalizer(setFormData, COMPANY_FIELD_RULES)}
        steps={[
          {
            id: "dados",
            label: "Dados da empresa",
            icon: Building,
            validate: validateDados,
            content: (
              <FormSection title="Dados da Empresa" icon={Building}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Nome da Empresa" required className="md:col-span-2">
                    <Input
                      icon={Building2}
                      type="text"
                      required
                      name="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ex: Construtora Silva Ltda"
                    />
                  </Field>
                  <Field label="CNPJ" required>
                    <Input
                      icon={FileText}
                      type="text"
                      required
                      value={formData.cnpj}
                      onChange={(e) =>
                        setFormData({ ...formData, cnpj: maskCnpj(e.target.value) })
                      }
                      placeholder="00.000.000/0000-00"
                    />
                  </Field>
                  <Field label="E-mail">
                    <Input
                      icon={Mail}
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="contato@empresa.com.br"
                    />
                  </Field>
                  <Field label="Telefone">
                    <Input
                      icon={Phone}
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: maskPhone(e.target.value) })
                      }
                      placeholder="(00) 00000-0000"
                    />
                  </Field>
                </div>
              </FormSection>
            ),
          },
          {
            id: "endereco",
            label: "Endereço",
            icon: MapPin,
            content: (
              <FormSection title="Endereço" icon={MapPin}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="CEP">
                    {/* Ao sair do campo, busca o endereço pelo CEP */}
                    <Input
                      icon={Hash}
                      type="text"
                      value={formData.cep}
                      onBlur={handleFindCep}
                      onChange={(e) =>
                        setFormData({ ...formData, cep: maskCep(e.target.value) })
                      }
                      placeholder="00000-000"
                    />
                  </Field>
                  <Field label="Endereço" className="md:col-span-2">
                    <Input
                      icon={MapPinned}
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Rua, número, bairro"
                    />
                  </Field>
                  <Field label="Cidade">
                    <Input
                      icon={MapPin}
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder="Ex: São Paulo"
                    />
                  </Field>
                  <Field label="Estado">
                    <Select
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                    >
                      <option value="">Selecione</option>
                      {estadosBrasil.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </FormSection>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default RegisterOrEditCompany;
