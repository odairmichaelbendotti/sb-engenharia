import { Trash2, X, AlertTriangle, Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useObras } from "../../store/obras";
import type { Obra } from "../../../types/obra";

interface DeleteObraModalProps {
  obra: Obra;
  handleClose: () => void;
}

export function DeleteObraModal({ obra, handleClose }: DeleteObraModalProps) {
  const { deleteObra } = useObras();
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    try {
      setIsLoading(true);
      await deleteObra(obra.id);
      toast.success(`Obra "${obra.nome}" excluída com sucesso`);
      handleClose();
    } catch {
      toast.error("Erro ao excluir obra. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-md shadow-2xl border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-bg rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-danger-text" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Excluir Obra</h2>
              <p className="text-sm text-text-secondary">Esta ação não pode ser desfeita</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-surface-muted rounded-lg transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-danger-bg border border-danger-border rounded-lg p-4">
            <p className="text-sm text-danger-text font-medium">
              Você está prestes a excluir permanentemente a obra:
            </p>
            <p className="text-sm text-text-primary font-semibold mt-1">"{obra.nome}"</p>
            <p className="text-xs text-text-muted mt-1">{obra.codigo} · {obra.cidade}/{obra.estado}</p>
          </div>
          <p className="text-sm text-text-secondary">
            Todos os dados associados, como cronogramas e anotações, serão perdidos. Confirme somente se tiver certeza.
          </p>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-5 py-2.5 text-text-secondary hover:bg-surface-muted rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-danger-text text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
            {isLoading ? "Excluindo..." : "Excluir Obra"}
          </button>
        </div>
      </div>
    </div>
  );
}
