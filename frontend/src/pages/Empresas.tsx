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

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [formData, setFormData] = useState<CreateCompanyType>({
    name: "",
    cnpj: "",
    city: "",
    state: "",
    address: "",
    phone: "",
    email: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEmpenhosModalOpen, setIsEmpenhosModalOpen] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(
    null,
  );
  const [empresaParaDeletar, setEmpresaParaDeletar] = useState<Empresa | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");

  const { companies, listCompanies, stats } = useCompanies();

  useEffect(() => {
    console.log("componente carregado (empresa.tsx)");
    listCompanies();
  }, []);

  useEffect(() => {
    setEmpresas(companies);
  }, [companies]);

  const openModal = (empresa?: Empresa) => {
    if (empresa) {
      setEmpresaSelecionada(empresa);
      setFormData({
        name: empresa.name,
        cnpj: empresa.cnpj,
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
        address: "",
        city: "",
        state: "",
        phone: "",
        email: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEmpresaSelecionada(null);
  };

  const openDeleteModal = (empresa: Empresa) => {
    setEmpresaParaDeletar(empresa);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setEmpresaParaDeletar(null);
  };

  const openEmpenhosModal = (empresa: Empresa) => {
    setEmpresaSelecionada(empresa);
    setIsEmpenhosModalOpen(true);
  };

  const closeEmpenhosModal = () => {
    setIsEmpenhosModalOpen(false);
    setEmpresaSelecionada(null);
  };

  const handleDelete = (id: string) => {
    alert(id);
    closeDeleteModal();
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
        <button
          onClick={() => openModal()}
          className="flex items-center cursor-pointer text-white justify-center gap-2 px-4 py-2 bg-primary-500 rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Nova Empresa
        </button>
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
        openEmpenhosModal={openEmpenhosModal}
        openModal={openModal}
        openDeleteModal={openDeleteModal}
        searchTerm={searchTerm}
      />

      {/* Modal - Cadastrar/Editar */}
      {isModalOpen && (
        <RegisterOrEditCompany
          closeModal={closeModal}
          empresaSelecionada={empresaSelecionada}
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {/* Modal - Empenhos */}
      {isEmpenhosModalOpen && empresaSelecionada && (
        <ModalEmpenho
          empresaSelecionada={empresaSelecionada}
          closeEmpenhosModal={closeEmpenhosModal}
        />
      )}

      {/* Modal - Confirmar Exclusão */}
      {isDeleteModalOpen && empresaParaDeletar && (
        <DeleteCompany
          empresaParaDeletar={empresaParaDeletar}
          closeDeleteModal={closeDeleteModal}
          handleDelete={handleDelete}
        />
      )}
    </div>
  );
}
