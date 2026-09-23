import {
  Loader,
  Trash2,
  X,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  FileSignature,
} from "lucide-react";
import type { Contrato } from "../../../types/contrato";
import { useContratos } from "../../store/contratos";
import { toast } from "sonner";
import { useState } from "react";
import { formatCurrency, formatDate } from "../../utils/format-currency";

interface DeleteContratoModalProps {
  isOpen: boolean;
  contrato: Contrato | null;
  handleClose: () => void;
}

export function DeleteContratoModal({
  isOpen,
  contrato,
  handleClose,
}: DeleteContratoModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { deleteContrato } = useContratos();

  async function handleDeleteContrato(id: string) {
    try {
      setIsLoading(true);
      await deleteContrato(id);
      toast.success("Contrato excluído com sucesso");
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir contrato";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen || !contrato) return null;

  const hasEmpenhos = contrato.empenhos.length > 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors z-10"
        >
          <X size={18} className="text-gray-400" />
        </button>

        <div className="bg-red-50 border-b border-red-100 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle size={19} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-red-900">
                Excluir Contrato Permanentemente
              </h2>
              <p className="text-xs text-red-700">
                Esta ação não poderá ser desfeita
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="bg-gray-50 rounded-xl p-3.5 mb-4 border border-gray-100">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <FileSignature size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Identificador</p>
                <p className="text-base font-bold text-gray-900">{contrato.identificador}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Empresa</p>
                  <p className="text-sm font-medium text-gray-800 truncate max-w-37.5">
                    {contrato.company.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Valor</p>
                  <p className="text-sm font-medium text-gray-800">{formatCurrency(contrato.valor)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Início</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(contrato.dataInicio)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Fim</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(contrato.dataFim)}</p>
                </div>
              </div>
            </div>
          </div>

          {hasEmpenhos ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 mb-4">
              <p className="text-xs text-red-800">
                <span className="font-semibold">Atenção:</span> este contrato possui{" "}
                {contrato.empenhos.length} empenho{contrato.empenhos.length !== 1 ? "s" : ""} vinculado
                {contrato.empenhos.length !== 1 ? "s" : ""}. Exclua ou realoque os empenhos antes de excluir o contrato.
              </p>
            </div>
          ) : (
            <p className="text-center text-gray-600 text-sm mb-4">
              Deseja realmente prosseguir com a exclusão?
            </p>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={() => handleClose()}
            className="flex-1 px-4 py-2.5 cursor-pointer text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleDeleteContrato(contrato.id)}
            disabled={isLoading || hasEmpenhos}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="animate-spin" size={16} />
            ) : (
              <>
                <Trash2 size={16} />
                Sim, Excluir Contrato
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
