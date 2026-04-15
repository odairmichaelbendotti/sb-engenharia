import { Trash2 } from "lucide-react";
import type { EmpenhoList } from "../../../../types/empenho";

interface EmpenhoDeleteModalProps {
  empenho: EmpenhoList | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function EmpenhoDeleteModal({
  empenho,
  onClose,
  onConfirm,
}: EmpenhoDeleteModalProps) {
  if (!empenho) return null;

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
            Tem certeza que deseja excluir o empenho
          </p>
          <p className="font-medium text-text-primary mb-6">
            &quot;{empenho.numero}&quot; - {empenho.company.name}?
          </p>
          <div className="flex justify-center gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:bg-surface-muted rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-danger-text text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Excluir Empenho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
