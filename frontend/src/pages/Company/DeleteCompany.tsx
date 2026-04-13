import { Loader, Trash2 } from "lucide-react";
import type { Empresa } from "../../../types/empresa";

type DeleteCompanyProps = {
  empresaParaDeletar: Empresa;
  closeDeleteModal: () => void;
  handleDelete: (id: string) => void;
  isLoading: boolean;
};

const DeleteCompany = ({
  empresaParaDeletar,
  closeDeleteModal,
  handleDelete,
  isLoading,
}: DeleteCompanyProps) => {
  return (
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
                {empresaParaDeletar.empenhos.length !== 1 ? "s" : ""} vinculado
                {empresaParaDeletar.empenhos.length !== 1 ? "s" : ""}.
              </p>
            </div>
          )}
          <div className="flex justify-center gap-3 shrink-0 mt-6">
            <button
              onClick={closeDeleteModal}
              className="w-full cursor-pointer py-2 text-text-secondary hover:bg-surface-muted rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleDelete(empresaParaDeletar.id)}
              className="flex items-center justify-center w-full cursor-pointer py-2 bg-danger-text hover:bg-red-700 text-white rounded-md transition-colors"
            >
              {isLoading ? (
                <Loader className="animate-spin" />
              ) : (
                "Excluir Empresa"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteCompany;
