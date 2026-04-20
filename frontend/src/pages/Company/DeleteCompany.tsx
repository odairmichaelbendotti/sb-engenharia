import {
  Loader,
  Trash2,
  X,
  AlertTriangle,
  Building2,
  Hash,
  Layers2,
} from "lucide-react";
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

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5",
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
        >
          <X size={20} className="text-gray-400" />
        </button>

        {/* Warning Banner */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle size={22} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-900">
                Excluir Empresa Permanentemente
              </h2>
              <p className="text-sm text-red-700">
                Esta ação não poderá ser desfeita
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Company Info Card */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <Building2 size={24} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-0.5">Razão Social</p>
                <p className="text-xl font-bold text-gray-900">
                  {empresaParaDeletar.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">CNPJ</p>
                  <p className="text-sm font-medium text-gray-800">
                    {formatCNPJ(empresaParaDeletar.cnpj)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Layers2 size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Empenhos Vinculados</p>
                  <p className="text-sm font-medium text-gray-800">
                    {empresaParaDeletar.empenhos.length} empenho
                    {empresaParaDeletar.empenhos.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Atenção:</span>{" "}
              {empresaParaDeletar.empenhos.length > 0 ? (
                <>
                  Esta empresa possui {empresaParaDeletar.empenhos.length}{" "}
                  empenho
                  {empresaParaDeletar.empenhos.length !== 1 ? "s" : ""}{" "}
                  vinculado
                  {empresaParaDeletar.empenhos.length !== 1 ? "s" : ""}. Ao
                  excluir a empresa, todos os empenhos, notas fiscais e
                  pagamentos associados também serão permanentemente removidos.
                </>
              ) : (
                <>
                  Ao excluir esta empresa, todos os dados associados serão
                  permanentemente removidos do sistema. Certifique-se de que não
                  há pendências.
                </>
              )}
            </p>
          </div>

          <p className="text-center text-gray-600 text-sm mb-6">
            Deseja realmente prosseguir com a exclusão?
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={handleClose}
            className="flex-1 px-5 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleDelete(empresaParaDeletar.id)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="animate-spin" size={18} />
            ) : (
              <>
                <Trash2 size={18} />
                Sim, Excluir Empresa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCompany;
