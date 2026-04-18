import { useState, useEffect } from "react";
import { Plus, Building2, Layers2 } from "lucide-react";
import { StatCard } from "../components/StatCard";
import type { Empresa } from "../../types/empresa";
import type { CreateCompanyType } from "../../types/create-company";
import { formatCurrency } from "../utils/format-currency";
import { useCompanies } from "../store/companies";
import DeleteCompany from "./Company/DeleteCompany";
import ModalEmpenho from "./Company/ModalEmpenho";
import RegisterOrEditCompany from "./Company/RegisterOrEditCompany";
import TableCompanies from "./Company/TableCompanies";
import FilterCompany from "./Company/FilterCompany";
import Breadcrumb from "../components/Breadcrumb";
import { toast } from "sonner";
import { useUser } from "../store/user";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { companies, listCompanies, stats, deleteCompany } = useCompanies();
  const { user } = useUser();

  useEffect(() => {
    console.log("componente carregado (empresa.tsx)");
    listCompanies();
  }, []);

  useEffect(() => {
    setEmpresas(companies);
  }, [companies]);

  const handleOpen = (empresa?: Empresa) => {
    if (empresa) {
      setEmpresaSelecionada(empresa);
      setFormData({
        name: empresa.name,
        cnpj: empresa.cnpj,
        cep: empresa.cep,
        address: empresa.address,
        city: empresa.city,
        state: empresa.state,
        phone: empresa.phone,
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

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteCompany(id);
      toast.success("Empresa deletada com sucesso");
    } catch (error) {
      toast.error("Erro ao deletar empresa");
      console.log(error);
    } finally {
      setIsLoading(false);
    }
    handleCloseDelete();
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb current="Empresas" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Building2 className="text-primary-500" />
            Empresas
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Gerencie as empresas cadastradas e seus empenhos
          </p>
        </div>
        {(user?.role === "EDITOR" || user?.role === "MASTER") && (
          <button
            onClick={() => handleOpen()}
            className="flex items-center cursor-pointer text-white justify-center gap-2 px-4 py-2 bg-primary-500 rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Nova Empresa
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total de Empresas"
          value={stats?.totalCompanies.toString() || "0"}
          subtitle="Cadastradas"
          icon={<Building2 size={24} className="text-primary-500" />}
          color="bg-primary-100"
        />
        <StatCard
          title="Total de Empenhos"
          value={stats?.totalEmpenhos.toString() || "0"}
          subtitle="Vinculados"
          icon={<Layers2 size={24} className="text-secondary-500" />}
          color="bg-secondary-100"
        />
        <StatCard
          title="Empenhos Ativos"
          value={stats?.totalEmpenhosActive.toString() || "0"}
          subtitle="Em andamento"
          icon={<Layers2 size={24} className="text-success-text" />}
          color="bg-success-bg"
        />
        <StatCard
          title="Valor Total"
          value={formatCurrency(stats?.totalEmpenhosValue || 0)}
          subtitle="Empenhado"
          icon={<span className="text-accent-500 font-bold text-lg">R$</span>}
          color="bg-accent-100"
        />
      </div>

      {/* Filters */}
      <FilterCompany searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Table */}
      <TableCompanies
        empresas={empresas}
        handleOpenEmpenhos={handleOpenEmpenhos}
        handleOpen={handleOpen}
        handleOpenDelete={handleOpenDelete}
        searchTerm={searchTerm}
      />

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
    </div>
  );
}
