import { Loader, Trash2, X, AlertTriangle, Building2 } from "lucide-react";
import type { Empresa } from "../../../types/empresa";

type DeleteCompanyProps = {
  isOpen: boolean;
  handleClose: () => void;
  empresaParaDeletar: Empresa;
  handleDelete: (id: string) => void;
  isLoading: boolean;
};

const DeleteCompany = ({
  isOpen,
  handleClose,
  empresaParaDeletar,
  handleDelete,
  isLoading,
}: DeleteCompanyProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-red-50/50 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Excluir Empresa
              </h2>
              <p className="text-sm text-text-secondary">
                Esta ação não pode ser desfeita
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-surface-muted rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-danger-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-danger-text" />
          </div>
          <p className="text-text-secondary text-sm mb-2">
            Tem certeza que deseja excluir permanentemente a empresa
          </p>
          <p className="font-semibold text-text-primary mb-6 text-lg">
            &quot;{empresaParaDeletar.name}&quot;
          </p>
          {empresaParaDeletar.empenhos.length > 0 && (
            <div className="bg-warning-bg border border-warning-border rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={16}
                  className="text-warning-text mt-0.5 shrink-0"
                />
                <p className="text-warning-text text-sm text-left">
                  <strong>Atenção:</strong> Esta empresa possui{" "}
                  {empresaParaDeletar.empenhos.length} empenho
                  {empresaParaDeletar.empenhos.length !== 1 ? "s" : ""}{" "}
                  vinculado
                  {empresaParaDeletar.empenhos.length !== 1 ? "s" : ""}. A
                  exclusão também removerá esses vínculos.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center gap-3 p-6 pt-0 shrink-0">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 text-text-secondary hover:bg-surface-muted rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleDelete(empresaParaDeletar.id)}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-danger-text text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="animate-spin" size={18} />
            ) : (
              <>
                <Trash2 size={18} />
                Excluir Empresa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCompany;
