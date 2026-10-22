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
  Tag,
} from "lucide-react";
import { StepForm } from "../../components/StepForm";
import { Field, FormSection, Input, Modal, ModalHeader, Select } from "../../components/ui";
import { useTenants } from "../../store/tenants";
import type { CreateTenantType } from "../../../types/create-tenant";
import { maskCnpj, maskPhone, maskCep, onlyDigits } from "../../utils/masks";
import { createBlurNormalizer, TENANT_FIELD_RULES } from "../../utils/normalization/form-rules";

type RegisterTenantProps = {
  isOpen: boolean;
  handleClose: () => void;
  formData: CreateTenantType;
  setFormData: React.Dispatch<React.SetStateAction<CreateTenantType>>;
};

const RegisterTenant = ({
  isOpen,
  handleClose,
  formData,
  setFormData,
}: RegisterTenantProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { createTenant, findCep } = useTenants();

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
    !formData.name.trim() || !formData.apelido.trim() || !onlyDigits(formData.cnpj)
      ? "Preencha o nome, o apelido e o CNPJ da organização"
      : null;

  const submit = async () => {
    const payload: CreateTenantType = {
      ...formData,
      cnpj: onlyDigits(formData.cnpj),
      phone: onlyDigits(formData.phone),
      cep: onlyDigits(formData.cep),
    };

    try {
      setIsLoading(true);
      await createTenant(payload);
      toast.success("Organização cadastrada com sucesso");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar organização",
      );
    } finally {
      setIsLoading(false);
    }

    handleClose();
  };

  if (!isOpen) return null;

  return (
    <Modal open size="xl" onClose={handleClose}>
      <ModalHeader
        icon={Building2}
        title="Nova Organização"
        description="Preencha os dados para cadastrar uma nova organização"
        onClose={handleClose}
      />

      <StepForm
        isSubmitting={isLoading}
        submitLabel="Cadastrar Organização"
        onCancel={handleClose}
        onSubmit={submit}
        onBlur={createBlurNormalizer(setFormData, TENANT_FIELD_RULES)}
        steps={[
          {
            id: "dados",
            label: "Dados da organização",
            icon: Building,
            validate: validateDados,
            content: (
              <FormSection title="Dados da Organização" icon={Building}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Nome" required className="md:col-span-2">
                    <Input
                      icon={Building2}
                      type="text"
                      required
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: 1º Batalhão de Engenharia"
                    />
                  </Field>
                  <Field label="Apelido" required>
                    <Input
                      icon={Tag}
                      type="text"
                      required
                      name="apelido"
                      value={formData.apelido}
                      onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                      placeholder="Ex: 1º BE"
                    />
                  </Field>
                  <Field label="CNPJ" required>
                    <Input
                      icon={FileText}
                      type="text"
                      required
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: maskCnpj(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                    />
                  </Field>
                  <Field label="E-mail" required>
                    <Input
                      icon={Mail}
                      type="email"
                      required
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@om.mil.br"
                    />
                  </Field>
                  <Field label="Telefone" required>
                    <Input
                      icon={Phone}
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
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
                  <Field label="CEP" required>
                    <Input
                      icon={Hash}
                      type="text"
                      required
                      value={formData.cep}
                      onBlur={handleFindCep}
                      onChange={(e) => setFormData({ ...formData, cep: maskCep(e.target.value) })}
                      placeholder="00000-000"
                    />
                  </Field>
                  <Field label="Endereço" required className="md:col-span-2">
                    <Input
                      icon={MapPinned}
                      type="text"
                      required
                      name="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, número, bairro"
                    />
                  </Field>
                  <Field label="Cidade" required>
                    <Input
                      icon={MapPin}
                      type="text"
                      required
                      name="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Ex: Brasília"
                    />
                  </Field>
                  <Field label="Estado" required>
                    <Select
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    >
                      <option value="">Selecione</option>
                      {estadosBrasil.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Latitude" required>
                    <Input
                      icon={MapPin}
                      type="number"
                      step="any"
                      required
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="-27.6754"
                    />
                  </Field>
                  <Field label="Longitude" required>
                    <Input
                      icon={MapPin}
                      type="number"
                      step="any"
                      required
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="-48.5663"
                    />
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

export default RegisterTenant;
