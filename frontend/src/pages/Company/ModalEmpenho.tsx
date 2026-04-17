import { Layers2, X } from "lucide-react";
import type { Empenho } from "../../../types/empenho";
import { formatCurrency } from "../../utils/format-currency";
import type { Empresa } from "../../../types/empresa";

type ModelEmpenhoProps = {
  empresaSelecionada: Empresa;
  closeEmpenhosModal: () => void;
};

const ModalEmpenho = ({
  empresaSelecionada,
  closeEmpenhosModal,
}: ModelEmpenhoProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getStatusLabel = (status: Empenho["status"]) => {
    switch (status) {
      case "ativo":
        return "Ativo";
      case "concluido":
        return "Concluído";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getStatusColor = (status: Empenho["status"]) => {
    switch (status) {
      case "ativo":
        return "bg-success-bg text-success-text border-success-border";
      case "concluido":
        return "bg-secondary-100 text-secondary-600 border-secondary-200";
      case "cancelado":
        return "bg-danger-bg text-danger-text border-danger-border";
      default:
        return "bg-surface-muted text-text-secondary";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Empenhos - {empresaSelecionada.name}
            </h2>
            <p className="text-sm text-text-secondary">
              {empresaSelecionada.empenhos.length} empenho
              {empresaSelecionada.empenhos.length !== 1 ? "s" : ""} vinculado
              {empresaSelecionada.empenhos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={closeEmpenhosModal}
            className="p-2 hover:bg-surface-muted rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {empresaSelecionada.empenhos.length > 0 ? (
            <div className="space-y-3">
              {empresaSelecionada.empenhos.map((empenho) => (
                <div
                  key={empenho.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-surface-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                      <Layers2 size={18} className="text-secondary-500" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">
                        {empenho.numero}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {formatDate(empenho.endAt)}{" "}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text-primary">
                      {formatCurrency(empenho.valor)}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        empenho.status,
                      )}`}
                    >
                      {getStatusLabel(empenho.status)}
                    </span>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">
                    Valor total dos empenhos:
                  </span>
                  <span className="text-lg font-bold text-text-primary">
                    {formatCurrency(
                      empresaSelecionada.empenhos.reduce(
                        (sum, e) => sum + e.valor,
                        0,
                      ),
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Layers2 size={48} className="mx-auto text-text-muted mb-4" />
              <p className="text-text-secondary font-medium">
                Nenhum empenho vinculado
              </p>
              <p className="text-text-muted text-sm mt-1">
                Esta empresa ainda não possui empenhos cadastrados
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end p-4 border-t border-border shrink-0">
          <button
            onClick={closeEmpenhosModal}
            className="px-4 py-2 text-text-secondary hover:bg-surface-muted rounded-md transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEmpenho;
