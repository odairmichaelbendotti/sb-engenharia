import { useState, useEffect, useMemo } from "react";
import type { Empresa } from "../../../types/empresa";
import type { CreateCompanyType } from "../../../types/create-company";
import { useCompanies } from "../../store/companies";
import DeleteCompany from "./DeleteCompany";
import ModalEmpenho from "./ModalEmpenho";
import RegisterOrEditCompany from "./RegisterOrEditCompany";
import TableCompanies from "./TableCompanies";
import { CreateCompanyAccessModal } from "./CreateCompanyAccessModal";
import FilterCompany from "./FilterCompany";
import { matchesCompanySearch } from "./company-search";
import { SummaryStrip, type SummaryCell } from "../../components/SummaryStrip";
import { formatCurrency } from "../../utils/format-currency";
import { toast } from "sonner";
import { usePermission } from "../../hooks/usePermission";
import { maskCnpj, maskPhone, maskCep } from "../../utils/masks";
import { PageHeader } from "../../components/PageHeader";
import { Building2 } from "lucide-react";

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [formData, setFormData] = useState<CreateCompanyType>({
    name: "",
    cnpj: "",
    cep: "",
    city: "",
    state: "",
    address: "",
    phone: "",
    email: "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEmpenhosOpen, setIsEmpenhosOpen] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(
    null,
  );
  const [empresaParaDeletar, setEmpresaParaDeletar] = useState<Empresa | null>(
    null,
  );
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [empresaParaAcesso, setEmpresaParaAcesso] = useState<Empresa | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListLoading, setIsListLoading] = useState(true);

  const { companies, listCompanies, deleteCompany } = useCompanies();

  // Totais das empresas que passam pela busca (empenhos cancelados não entram nos valores)
  const summaryCells = useMemo<SummaryCell[]>(() => {
    const visiveis = empresas.filter((e) => matchesCompanySearch(e, searchTerm));
    const empenhos = visiveis
      .flatMap((e) => e.empenhos)
      .filter((emp) => (emp.status ?? "").toUpperCase() !== "CANCELADO");
    const ativos = empenhos.filter((emp) => (emp.status ?? "").toUpperCase() === "ATIVO").length;
    const comAtivo = visiveis.filter((e) =>
      e.empenhos.some((emp) => (emp.status ?? "").toUpperCase() === "ATIVO"),
    ).length;
    const empenhado = empenhos.reduce((acc, emp) => acc + emp.value, 0);
    const liquidado = empenhos.reduce((acc, emp) => acc + (emp.totalPaid ?? 0), 0);
    const pct = empenhado > 0 ? Math.round((liquidado / empenhado) * 100) : 0;

    return [
      {
        key: "empresas",
        label: "Empresas",
        value: String(visiveis.length),
        hint: `${comAtivo} com empenho ativo`,
      },
      {
        key: "empenhado",
        label: "Empenhado",
        value: formatCurrency(empenhado),
        hint: `${empenhos.length} ${empenhos.length === 1 ? "empenho" : "empenhos"} · ${ativos} ${ativos === 1 ? "ativo" : "ativos"}`,
      },
      { key: "liquidado", label: "Liquidado", value: formatCurrency(liquidado), hint: `${pct}% do empenhado` },
      {
        key: "saldo",
        label: "A liquidar",
        value: formatCurrency(Math.max(0, empenhado - liquidado)),
        hint: "do valor empenhado",
        tone: "primary",
      },
    ];
  }, [empresas, searchTerm]);

  useEffect(() => {
    listCompanies().finally(() => setIsListLoading(false));
  }, [listCompanies]);

  useEffect(() => {
    setEmpresas(companies);
  }, [companies]);

  const handleOpen = (empresa?: Empresa) => {
    if (empresa) {
      setEmpresaSelecionada(empresa);
      setFormData({
        name: empresa.name,
        cnpj: maskCnpj(empresa.cnpj),
        cep: maskCep(empresa.cep),
        address: empresa.address,
        city: empresa.city,
        state: empresa.state,
        phone: maskPhone(empresa.phone),
        email: empresa.email,
      });
    } else {
      setEmpresaSelecionada(null);
      setFormData({
        name: "",
        cnpj: "",
        cep: "",
        address: "",
        city: "",
        state: "",
        phone: "",
        email: "",
      });
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEmpresaSelecionada(null);
  };

  const handleOpenDelete = (empresa: Empresa) => {
    setEmpresaParaDeletar(empresa);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setEmpresaParaDeletar(null);
  };

  const handleOpenEmpenhos = (empresa: Empresa) => {
    setEmpresaSelecionada(empresa);
    setIsEmpenhosOpen(true);
  };

  const handleCloseEmpenhos = () => {
    setIsEmpenhosOpen(false);
    setEmpresaSelecionada(null);
  };

  const handleOpenAccess = (empresa: Empresa) => {
    setEmpresaParaAcesso(empresa);
    setIsAccessOpen(true);
  };

  const handleCloseAccess = () => {
    setIsAccessOpen(false);
    setEmpresaParaAcesso(null);
  };

  const { canEditAdministrativo } = usePermission();

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteCompany(id);
      toast.success("Empresa deletada com sucesso");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao deletar empresa";
      toast.error(message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
    handleCloseDelete();
  };

  return (
    <div className="p-4 md:p-5 max-w-7xl mx-auto">
      <PageHeader
        icon={Building2}
        title="Empresas"
        canAct={canEditAdministrativo}
        actionLabel="Nova Empresa"
        onAction={() => handleOpen()}
      />

      {/* Filters + Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <SummaryStrip cells={summaryCells} className="rounded-t-lg" />
        <div className="px-4 pt-3 pb-2 border-b border-border">
          <FilterCompany
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>
        <TableCompanies
          empresas={empresas}
          isLoading={isListLoading}
          handleOpenEmpenhos={handleOpenEmpenhos}
          handleOpen={handleOpen}
          handleOpenDelete={handleOpenDelete}
          handleOpenAccess={handleOpenAccess}
          onAdd={() => handleOpen()}
          searchTerm={searchTerm}
        />
      </div>

      {/* Modal - Cadastrar/Editar */}
      {isOpen && (
        <RegisterOrEditCompany
          isOpen={isOpen}
          handleClose={handleClose}
          empresaSelecionada={empresaSelecionada}
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {/* Modal - Empenhos */}
      {isEmpenhosOpen && empresaSelecionada && (
        <ModalEmpenho
          isOpen={isEmpenhosOpen}
          handleClose={handleCloseEmpenhos}
          empresaSelecionada={empresaSelecionada}
        />
      )}

      {/* Modal - Confirmar Exclusão */}
      {isDeleteOpen && empresaParaDeletar && (
        <DeleteCompany
          isOpen={isDeleteOpen}
          handleClose={handleCloseDelete}
          empresaParaDeletar={empresaParaDeletar}
          handleDelete={handleDelete}
          isLoading={isLoading}
        />
      )}

      {/* Modal - Criar Acesso da Empresa */}
      {isAccessOpen && empresaParaAcesso && (
        <CreateCompanyAccessModal
          empresa={empresaParaAcesso}
          handleClose={handleCloseAccess}
        />
      )}
    </div>
  );
}
