import {
  Loader,
  Trash2,
  X,
  AlertTriangle,
  FileSignature,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import type { OrdemServico } from "../../../types/ordem-servico";
import { useOrdensServico } from "../../store/ordensServico";
import { toast } from "sonner";
import { useState } from "react";
import { formatCurrency } from "../../utils/format-currency";

interface DeleteOrdemServicoModalProps {
  isOpen: boolean;
  ordemServico: OrdemServico | null;
  handleClose: () => void;
}

export function DeleteOrdemServicoModal({
  isOpen,
  ordemServico,
  handleClose,
}: DeleteOrdemServicoModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { deleteOrdemServico } = useOrdensServico();

  async function handleDeleteOrdemServico(id: string) {
    try {
      setIsLoading(true);
      await deleteOrdemServico(id);
      toast.success("Ordem de serviço excluída com sucesso");
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir ordem de serviço";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen || !ordemServico) return null;

  const hasObra = ordemServico.obra !== null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors z-10"
        >
          <X size={20} className="text-gray-400" />
        </button>

        <div className="bg-red-50 border-b border-red-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle size={22} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-900">
                Excluir Ordem de Serviço Permanentemente
              </h2>
              <p className="text-sm text-red-700">
                Esta ação não poderá ser desfeita
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <ClipboardList size={24} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-0.5">Número</p>
                <p className="text-xl font-bold text-gray-900">{ordemServico.numero}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <FileSignature size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Empenho</p>
                  <p className="text-sm font-medium text-gray-800 truncate max-w-37.5">
                    {ordemServico.empenho.numero} — {ordemServico.empenho.contrato.identificador}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Valor</p>
                  <p className="text-sm font-medium text-gray-800">{formatCurrency(ordemServico.valor)}</p>
                </div>
              </div>
            </div>
          </div>

          {hasObra ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                <span className="font-semibold">Atenção:</span> esta ordem de serviço está vinculada
                à obra "{ordemServico.obra?.nome}". Exclua ou realoque a obra antes de excluir a ordem
                de serviço.
              </p>
            </div>
          ) : (
            <p className="text-center text-gray-600 text-sm mb-6">
              Deseja realmente prosseguir com a exclusão?
            </p>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={() => handleClose()}
            className="flex-1 px-5 py-3 cursor-pointer text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleDeleteOrdemServico(ordemServico.id)}
            disabled={isLoading || hasObra}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="animate-spin" size={18} />
            ) : (
              <>
                <Trash2 size={18} />
                Sim, Excluir Ordem de Serviço
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
