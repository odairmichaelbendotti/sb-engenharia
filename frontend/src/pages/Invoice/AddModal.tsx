import { useEffect, useState } from "react";
import {
  Receipt,
  Hash,
  Building2,
  AlignLeft,
  CalendarDays,
  Banknote,
  CircleAlert,
} from "lucide-react";
import type { InvoiceFormData } from "../../../types/invoice";
import { StepForm } from "../../components/StepForm";
import { Field, FormSection, Input, Modal, ModalHeader, Select, Textarea } from "../../components/ui";
import { useObras } from "../../store/obras";
import type { Empenho } from "../../../types/empenho";
import { toast } from "sonner";
import { useInvoice } from "../../store/invoices";
import { EmpenhoDetails } from "./EmpenhoDetails";
import { formatValueToCurrencyMask, maskCurrency, parseCurrencyMask } from "../../utils/masks";
import type { MedicaoParaNota } from "../../../types/obra";
import { MedicaoField } from "./MedicaoField";
import { createBlurNormalizer, INVOICE_FIELD_RULES } from "../../utils/normalization/form-rules";

interface AddModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Nota nova já no empenho escolhido (ação "Nova nota fiscal" da lista de empenhos)
  initialEmpenho?: { companyId: string; empenhoId: string } | null;
}

type CreateInvoiceFormData = Omit<InvoiceFormData, "status">;

const initialFormData: CreateInvoiceFormData = {
  numero: "",
  description: "",
  vencimento: "",
  value: "",
  empenho_id: "",
  company_id: "",
  ordemServico_id: "",
  medicao_id: "",
};

export function AddModal({ isOpen, setIsOpen, initialEmpenho = null }: AddModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [empenhosByCompany, setEmpenhosByCompany] = useState<Empenho[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmpenho, setSelectedEmpenho] = useState<Empenho | null>(null);

  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const { create, companyOptions: companies, fetchCompanyOptions } = useInvoice();
  const { obraOptionsForInvoice, fetchObraOptionsForInvoice } = useObras();

  // Sempre recarrega ao abrir: só entram empresas com contrato na organização do
  // usuário, e os empenhos de cada uma mudam com frequência
  useEffect(() => {
    fetchCompanyOptions()
      .then(() => {
        if (!initialEmpenho) return;
        // Preenche empresa e empenho com as opções que acabaram de chegar
        const company = useInvoice.getState().companyOptions.find((c) => c.id === initialEmpenho.companyId);
        if (!company) return;
        setFormData((f) => ({ ...f, company_id: company.id }));
        setEmpenhosByCompany(company.empenhos);
        selectEmpenho(initialEmpenho.empenhoId, company.empenhos);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Não foi possível carregar as empresas");
      })
      .finally(() => setLoadingCompanies(false));
    // Só ao abrir: o empenho inicial não muda com o modal aberto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCompanyOptions]);

  function handleChangeCompany(companyId: string) {
    setFormData((f) => ({ ...f, company_id: companyId, empenho_id: "", ordemServico_id: "", medicao_id: "" }));
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      setEmpenhosByCompany(company.empenhos);
    } else {
      setEmpenhosByCompany([]);
    }
  }

  function handleChangeEmpenho(
    e: React.ChangeEvent<HTMLSelectElement, HTMLSelectElement>,
  ) {
    selectEmpenho(e.target.value, empenhosByCompany);
  }

  function selectEmpenho(empenhoId: string, options: Empenho[]) {
    setFormData((f) => ({ ...f, empenho_id: empenhoId, ordemServico_id: "", medicao_id: "" }));

    const empenho = options.find(
      (f) => f.id.toString() === empenhoId,
    );

    if (!empenho) return setSelectedEmpenho(null);

    setSelectedEmpenho(empenho);
    fetchObraOptionsForInvoice(empenhoId)
      .then((options) => {
        // Empenho que financia uma única OS com obra: ela já vem selecionada
        if (options.length === 1) {
          setFormData((f) => (f.empenho_id === empenhoId ? { ...f, ordemServico_id: options[0]!.ordemServico.id } : f));
        }
      })
      .catch(() => {});
  }

  if (!isOpen) return null;

  // Medição já paga por outra nota não aparece: só as livres podem ser escolhidas
  const medicoesDaOS = (
    obraOptionsForInvoice.find((o) => o.ordemServico.id === formData.ordemServico_id)?.medicoes ?? []
  ).filter((m) => !m.notaFiscal);

  // Escolher a medição traz o valor dela; voltar para "sem medição" mantém o valor para editar
  function selectMedicao(medicao: MedicaoParaNota | null) {
    setFormData((f) => ({
      ...f,
      medicao_id: medicao?.id ?? "",
      value: medicao ? formatValueToCurrencyMask(medicao.valor) : f.value,
    }));
  }

  // Validação de cada etapa: devolve a mensagem do primeiro problema ou null
  function validateEmpenho() {
    if (!formData.company_id || !formData.empenho_id) return "Selecione a empresa e o empenho da nota fiscal";
    if (obraOptionsForInvoice.length > 0 && !formData.ordemServico_id) {
      return "Selecione a obra e a OS desta nota fiscal: o empenho financia obras.";
    }
    return null;
  }

  function validateDados() {
    if (!formData.numero || !formData.value || !formData.vencimento) {
      return "Preencha o número, o valor e o vencimento da nota fiscal";
    }
    return null;
  }

  async function submit() {
    const obraDaOS = obraOptionsForInvoice.find((o) => o.ordemServico.id === formData.ordemServico_id);

    const nf = {
      numero: formData.numero,
      description: formData.description,
      vencimento: formData.vencimento,
      value: parseCurrencyMask(formData.value),
      empenho_id: formData.empenho_id,
      company_id: formData.company_id,
      obra_id: obraDaOS?.id,
      ordemServico_id: formData.ordemServico_id || undefined,
      medicao_id: formData.medicao_id || undefined,
    };

    try {
      setIsLoading(true);
      await create(nf);

      toast.success("Nota fiscal criada com sucesso");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Erro ao criar nota fiscal");
      return;
    } finally {
      setIsLoading(false);
    }

    setFormData(initialFormData);
  }

  return (
    <Modal open size="xl" onClose={() => setIsOpen(false)}>
      <ModalHeader
        icon={Receipt}
        title="Nova Nota Fiscal"
        description="Preencha os dados para emitir uma nova NF"
        onClose={() => setIsOpen(false)}
      />

      <StepForm
        isSubmitting={isLoading}
        submitLabel="Criar Nota Fiscal"
        onCancel={() => setIsOpen(false)}
        onSubmit={submit}
        onBlur={createBlurNormalizer(setFormData, INVOICE_FIELD_RULES)}
        steps={[
          {
            id: "empenho",
            label: "Empresa e empenho",
            icon: Building2,
            validate: validateEmpenho,
            content: (
              <FormSection title="Cliente e Empenho" icon={Building2}>
                <Field label="Cliente">
                  <Select
                    icon={Building2}
                    value={formData.company_id}
                    onChange={(e) => handleChangeCompany(e.target.value)}
                    disabled={loadingCompanies}
                  >
                    <option value="">
                      {loadingCompanies
                        ? "Carregando empresas..."
                        : companies.length === 0
                          ? "Nenhuma empresa com contrato nesta organização"
                          : "Selecione a empresa"}
                    </option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Empenho">
                  <Select
                    icon={formData.company_id ? Banknote : CircleAlert}
                    disabled={!formData.company_id && true}
                    value={formData.empenho_id}
                    onChange={(e) => handleChangeEmpenho(e)}
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
                  </Select>
                </Field>
                {/* Obrigatória quando o empenho financia alguma obra; uma opção por OS da obra */}
                <Field
                  label={obraOptionsForInvoice.length > 0 ? "Obra / OS" : "Obra / OS (opcional)"}
                  required={obraOptionsForInvoice.length > 0}
                >
                  <Select
                    disabled={!formData.empenho_id}
                    value={formData.ordemServico_id}
                    onChange={(e) => setFormData((f) => ({ ...f, ordemServico_id: e.target.value, medicao_id: "" }))}
                  >
                    <option value="">
                      {!formData.empenho_id
                        ? "Primeiro selecione o empenho"
                        : obraOptionsForInvoice.length > 0
                          ? "Selecione a obra e a OS"
                          : "Nenhuma obra específica"}
                    </option>
                    {obraOptionsForInvoice.map((obra) => (
                      <option key={obra.ordemServico.id} value={obra.ordemServico.id}>
                        {obra.identificacaoPatrimonial} — {obra.nome} · OS {obra.ordemServico.numero}
                      </option>
                    ))}
                  </Select>
                </Field>
              </FormSection>
            ),
          },
          {
            id: "dados",
            label: "Número, valor e datas",
            icon: Hash,
            validate: validateDados,
            content: (
              <>
                <FormSection title="Identificação" icon={Hash}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Medições fechadas da OS: a nota pode pagar uma delas em vez de um valor digitado */}
                    {medicoesDaOS.length > 0 && (
                      <div className="md:col-span-2">
                        <MedicaoField
                          medicoes={medicoesDaOS}
                          value={formData.medicao_id}
                          onChange={selectMedicao}
                        />
                      </div>
                    )}
                    <Field label="Número da NF" required>
                      <Input
                        icon={Hash}
                        type="text"
                        required
                        name="numero"
                        value={formData.numero}
                        onChange={(e) =>
                          setFormData((f) => ({ ...f, numero: e.target.value }))
                        }
                        placeholder="NF-2024-001"
                      />
                    </Field>
                    <Field label="Valor" required>
                      <Input
                        prefix="R$"
                        type="text"
                        inputMode="numeric"
                        required
                        // Com medição, o valor é o dela
                        disabled={formData.medicao_id !== ""}
                        value={formData.value}
                        onChange={(e) =>
                          setFormData((f) => ({ ...f, value: maskCurrency(e.target.value) }))
                        }
                        placeholder="0,00"
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Datas e Status" icon={CalendarDays}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Vencimento" required>
                      <Input
                        type="date"
                        required
                        value={formData.vencimento}
                        onChange={(e) =>
                          setFormData((f) => ({ ...f, vencimento: e.target.value }))
                        }
                      />
                    </Field>
                  </div>
                </FormSection>
              </>
            ),
          },
          {
            id: "descricao",
            label: "Descrição e resumo",
            icon: AlignLeft,
            content: (
              <>
                {/* Empenho Selecionado */}
                {selectedEmpenho && (
                  <EmpenhoDetails
                    empenho={selectedEmpenho}
                    newValue={formData.value}
                  />
                )}

                <FormSection title="Descrição" icon={AlignLeft}>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Descreva os serviços ou produtos..."
                    rows={3}
                    aria-label="Descrição"
                  />
                </FormSection>
              </>
            ),
          },
        ]}
      />
    </Modal>
  );
}
