import { X } from "lucide-react";

interface FormData {
  numero: string;
  empresaId: string;
  empresaNome: string;
  valor: string;
  data: string;
  dataLimite: string;
  status: "ativo" | "concluido" | "cancelado";
  descricao: string;
}

interface EmpenhoModalProps {
  isOpen: boolean;
  editingId: string | null;
  formData: FormData;
  empresasMock: { id: number; nome: string; cnpj: string }[];
  onClose: () => void;
  onSubmit: () => void;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
}

export function EmpenhoModal({
  isOpen,
  editingId,
  formData,
  empresasMock,
  onClose,
  onSubmit,
  onChange,
}: EmpenhoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-text-primary">
            {editingId ? "Editar Empenho" : "Novo Empenho"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-muted rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="p-4 overflow-y-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Número do Empenho *
              </label>
              <input
                type="text"
                name="numero"
                required
                value={formData.numero}
                onChange={onChange}
                placeholder="EMP-2024-001"
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Valor *
              </label>
              <input
                type="number"
                name="valor"
                required
                value={formData.valor}
                onChange={onChange}
                placeholder="0.00"
                step="0.01"
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Empresa *
              </label>
              <select
                name="empresaId"
                required
                value={formData.empresaId}
                onChange={onChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">Selecione uma empresa</option>
                {empresasMock.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nome} - {empresa.cnpj}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Descrição
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={onChange}
                placeholder="Descrição do empenho e serviços contratados"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Data do Empenho
              </label>
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={onChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Data Limite
              </label>
              <input
                type="date"
                name="dataLimite"
                value={formData.dataLimite}
                onChange={onChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={onChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="ativo">Ativo</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:bg-surface-muted rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              {editingId ? "Salvar Alterações" : "Criar Empenho"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
