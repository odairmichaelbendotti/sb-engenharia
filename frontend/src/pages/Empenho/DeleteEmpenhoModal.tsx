import {
  Loader,
  Trash2,
  X,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";
import type { EmpenhoList } from "../../../types/empenho";
import { useEmpenhos } from "../../store/empenhos";
import { toast } from "sonner";
import { useState } from "react";

interface DeleteEmpenhoModalProps {
  isOpen: boolean;
  empenho: EmpenhoList | null;
  handleClose: () => void;
}

export function DeleteEmpenhoModal({
  isOpen,
  empenho,
  handleClose,
}: DeleteEmpenhoModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleDeleteEmpenho(id: string) {
    try {
      setIsLoading(true);
      await deleteEmpenho(id);
      toast.success("Empenho excluído com sucesso");
      handleClose();
    } catch (error) {
      console.log(error);
      toast.error("Erro ao excluir empenho");
    } finally {
      setIsLoading(false);
    }
  }

  const { deleteEmpenho } = useEmpenhos();

  if (!isOpen || !empenho) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
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
                Excluir Empenho Permanentemente
              </h2>
              <p className="text-sm text-red-700">
                Esta ação não poderá ser desfeita
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Empenho Info Card */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={24} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-0.5">
                  Número do Empenho
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {empenho.numero}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Empresa</p>
                  <p className="text-sm font-medium text-gray-800 truncate max-w-37.5">
                    {empenho.company.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Valor Total</p>
                  <p className="text-sm font-medium text-gray-800">
                    {formatCurrency(empenho.value)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Início</p>
                  <p className="text-sm font-medium text-gray-800">
                    {formatDate(empenho.startAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Prazo Final</p>
                  <p className="text-sm font-medium text-gray-800">
                    {formatDate(empenho.endAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Atenção:</span> Ao excluir este
              empenho, todas as notas fiscais e pagamentos associados também
              serão removidos do sistema.
            </p>
          </div>

          <p className="text-center text-gray-600 text-sm mb-6">
            Deseja realmente prosseguir com a exclusão?
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={() => handleClose()}
            className="flex-1 px-5 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleDeleteEmpenho(empenho.id)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="animate-spin" size={18} />
            ) : (
              <>
                <Trash2 size={18} />
                Sim, Excluir Empenho
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
