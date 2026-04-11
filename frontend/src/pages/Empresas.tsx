import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  Home,
  Layers2,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Loader2,
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import type { Empenho } from "../../types/empenho";
import type { Empresa } from "../../types/empresa";
import { estadosBrasil } from "../utils/estados-brasil";
import { toast } from "sonner";
import { useCompanies } from "../store/companies";

interface FormData {
  name: string;
  cnpj: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
}

const ITEMS_PER_PAGE = 10;

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEmpenhosModalOpen, setIsEmpenhosModalOpen] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(
    null,
  );
  const [empresaParaDeletar, setEmpresaParaDeletar] = useState<Empresa | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    cnpj: "",
    city: "",
    state: "",
    address: "",
    phone: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const filteredEmpresas = useMemo(() => {
    return empresas.filter(
      (empresa) =>
        empresa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empresa.cnpj.includes(searchTerm) ||
        empresa.city.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [empresas, searchTerm]);

  const totalPages = Math.ceil(filteredEmpresas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmpresas = filteredEmpresas.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const api_url = import.meta.env.VITE_HOST;
  const { companies, listCompanies } = useCompanies();

  useEffect(() => {
    listCompanies();
    setEmpresas(companies);
  }, [listCompanies, companies]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getStatusColor = (status: Empenho["status"]) => {
    switch (status) {
      case "ativo":
        return "bg-success-bg text-success-text border-success-border";
      case "concluido":
        return "bg-secondary-100 text-secondary-600 border-secondary-200";
      case "cancelado":
        return "bg-danger-bg text-danger-text border-danger-border";
      default:
        return "bg-surface-muted text-text-secondary";
    }
  };

  const getStatusLabel = (status: Empenho["status"]) => {
    switch (status) {
      case "ativo":
        return "Ativo";
      case "concluido":
        return "Concluído";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const response = await fetch(`${api_url}/company/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        console.log("Erro ao cadastrar empresa");
        throw new Error("Erro ao cadastrar empresa");
      }

      toast.success("Empresa cadastrada com sucesso");
    } catch (error) {
      console.log(error);
      toast.error("Erro ao cadastrar empresa");
    } finally {
      setIsLoading(false);
    }

    closeModal();
  };

  const handleDelete = () => {
    if (empresaParaDeletar) {
      setEmpresas(empresas.filter((emp) => emp.id !== empresaParaDeletar.id));
      closeDeleteModal();
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-secondary mb-4">
        <Home size={16} />
        <span>/</span>
        <span>Administrativo</span>
        <span>/</span>
        <span className="text-text-primary font-medium">Empresas</span>
      </nav>

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
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Nova Empresa
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total de Empresas"
          value={empresas.length.toString()}
          subtitle="Cadastradas"
          icon={<Building2 size={24} className="text-primary-500" />}
          color="bg-primary-100"
        />
        <StatCard
          title="Total de Empenhos"
          value={empresas
            .reduce((acc, emp) => acc + emp.empenhos.length, 0)
            .toString()}
          subtitle="Vinculados"
          icon={<Layers2 size={24} className="text-secondary-500" />}
          color="bg-secondary-100"
        />
        <StatCard
          title="Empenhos Ativos"
          value={empresas
            .reduce(
              (acc, emp) =>
                acc + emp.empenhos.filter((e) => e.status === "ativo").length,
              0,
            )
            .toString()}
          subtitle="Em andamento"
          icon={<Layers2 size={24} className="text-success-text" />}
          color="bg-success-bg"
        />
        <StatCard
          title="Valor Total"
          value={formatCurrency(
            empresas.reduce(
              (acc, emp) =>
                acc + emp.empenhos.reduce((sum, e) => sum + e.valor, 0),
              0,
            ),
          )}
          subtitle="Empenhado"
          icon={<span className="text-accent-500 font-bold text-lg">R$</span>}
          color="bg-accent-100"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-surface-muted transition-colors text-sm text-text-secondary">
          <Filter size={16} />
          Filtros
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-muted border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                  Empresa
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
                  CNPJ
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden lg:table-cell">
                  Localização
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden sm:table-cell">
                  Contato
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                  Empenhos
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedEmpresas.map((empresa) => (
                <tr
                  key={empresa.id}
                  className="hover:bg-surface-muted/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                        <Building2 size={18} className="text-primary-500" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary text-sm">
                          {empresa.name}
                        </p>
                        <p className="text-xs text-text-secondary md:hidden">
                          {empresa.cnpj}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary hidden md:table-cell">
                    {empresa.cnpj}
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                      <MapPin size={14} />
                      <span>
                        {empresa.city}, {empresa.state}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <div className="text-sm text-text-secondary">
                      <p className="flex items-center gap-1">
                        <Phone size={12} />
                        {empresa.phone}
                      </p>
                      <p className="flex items-center gap-1 text-xs mt-1">
                        <Mail size={12} />
                        {empresa.email}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openEmpenhosModal(empresa)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        empresa.empenhos.length > 0
                          ? "bg-primary-100 text-primary-600 hover:bg-primary-200"
                          : "bg-surface-muted text-text-muted"
                      }`}
                    >
                      <Layers2 size={12} />
                      {empresa.empenhos.length} empenho
                      {empresa.empenhos.length !== 1 ? "s" : ""}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openModal(empresa)}
                        className="p-2 hover:bg-primary-100 text-text-secondary hover:text-primary-500 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(empresa)}
                        className="p-2 hover:bg-danger-bg text-text-secondary hover:text-danger-text rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedEmpresas.length === 0 && (
          <div className="py-12 text-center">
            <Building2 size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-text-secondary font-medium">
              Nenhuma empresa encontrada
            </p>
            <p className="text-text-muted text-sm mt-1">
              Tente ajustar os filtros ou cadastre uma nova empresa
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted">
            <p className="text-sm text-text-secondary">
              Mostrando {startIndex + 1} a{" "}
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredEmpresas.length)}{" "}
              de {filteredEmpresas.length} empresas
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-text-secondary">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Cadastrar/Editar */}
      {isModalOpen && (
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
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="(00) 00000-0000"
                  />
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
      )}

      {/* Modal - Empenhos */}
      {isEmpenhosModalOpen && empresaSelecionada && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Empenhos - {empresaSelecionada.name}
                </h2>
                <p className="text-sm text-text-secondary">
                  {empresaSelecionada.empenhos.length} empenho
                  {empresaSelecionada.empenhos.length !== 1 ? "s" : ""}{" "}
                  vinculado
                  {empresaSelecionada.empenhos.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={closeEmpenhosModal}
                className="p-2 hover:bg-surface-muted rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {empresaSelecionada.empenhos.length > 0 ? (
                <div className="space-y-3">
                  {empresaSelecionada.empenhos.map((empenho) => (
                    <div
                      key={empenho.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-surface-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                          <Layers2 size={18} className="text-secondary-500" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary text-sm">
                            {empenho.numero}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {formatDate(empenho.data)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-text-primary">
                          {formatCurrency(empenho.valor)}
                        </p>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            empenho.status,
                          )}`}
                        >
                          {getStatusLabel(empenho.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary text-sm">
                        Valor total dos empenhos:
                      </span>
                      <span className="text-lg font-bold text-text-primary">
                        {formatCurrency(
                          empresaSelecionada.empenhos.reduce(
                            (sum, e) => sum + e.valor,
                            0,
                          ),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Layers2 size={48} className="mx-auto text-text-muted mb-4" />
                  <p className="text-text-secondary font-medium">
                    Nenhum empenho vinculado
                  </p>
                  <p className="text-text-muted text-sm mt-1">
                    Esta empresa ainda não possui empenhos cadastrados
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end p-4 border-t border-border shrink-0">
              <button
                onClick={closeEmpenhosModal}
                className="px-4 py-2 text-text-secondary hover:bg-surface-muted rounded-md transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Confirmar Exclusão */}
      {isDeleteModalOpen && empresaParaDeletar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl w-full max-w-md max-h-[85vh] flex flex-col p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="text-center overflow-y-auto">
              <div className="w-12 h-12 bg-danger-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-danger-text" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-text-secondary text-sm mb-2">
                Tem certeza que deseja excluir a empresa
              </p>
              <p className="font-medium text-text-primary mb-6">
                "{empresaParaDeletar.name}"?
              </p>
              {empresaParaDeletar.empenhos.length > 0 && (
                <div className="bg-warning-bg border border-warning-border rounded-md p-3 mb-6">
                  <p className="text-warning-text text-sm">
                    Atenção: Esta empresa possui{" "}
                    {empresaParaDeletar.empenhos.length} empenho
                    {empresaParaDeletar.empenhos.length !== 1 ? "s" : ""}{" "}
                    vinculado
                    {empresaParaDeletar.empenhos.length !== 1 ? "s" : ""}.
                  </p>
                </div>
              )}
              <div className="flex justify-center gap-3 shrink-0 mt-6">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-text-secondary hover:bg-surface-muted rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-danger-text text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Excluir Empresa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
