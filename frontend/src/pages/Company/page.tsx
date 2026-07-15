import { useState, useEffect } from "react";
import type { Empresa } from "../../../types/empresa";
import type { CreateCompanyType } from "../../../types/create-company";
import { useCompanies } from "../../store/companies";
import DeleteCompany from "./DeleteCompany";
import ModalEmpenho from "./ModalEmpenho";
import RegisterOrEditCompany from "./RegisterOrEditCompany";
import TableCompanies from "./TableCompanies";
import FilterCompany from "./FilterCompany";
import CompanyHeader from "./CompanyHeader";
import CompanyStats from "./CompanyStats";
import { toast } from "sonner";
import { usePermission } from "../../hooks/usePermission";

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
  const [isListLoading, setIsListLoading] = useState(true);

  const { companies, listCompanies, stats, deleteCompany } = useCompanies();

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

  const { canEditAdministrativo } = usePermission();

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteCompany(id);
      toast.success("Empresa deletada com sucesso");
    } catch (error) {
      toast.error("Erro ao deletar empresa");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
    handleCloseDelete();
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <CompanyHeader
        canCreateAndEditContent={canEditAdministrativo}
        onAdd={() => handleOpen()}
      />

      <CompanyStats stats={stats} />

      {/* Filters + Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
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
    </div>
  );
}
