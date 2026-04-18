import {
  Layers2,
  Building2,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Check,
  Play,
} from "lucide-react";
import type { EmpenhoList } from "../../../types/empenho";
import type { User } from "../../../types/user";
import { useEmpenhos } from "../../store/empenhos";

interface EmpenhoTableProps {
  empenhos: EmpenhoList[];
  formatCurrency: (value: number) => string;
  onEdit: (empenho: EmpenhoList) => void;
  onDelete: (empenho: EmpenhoList) => void;
  user: User | null;
}

const formatDate = (date: Date | string) => {
  if (typeof date === "string") {
    return new Date(date).toLocaleDateString("pt-BR");
  }
  return date.toLocaleDateString("pt-BR");
};

const getStatusConfig = (status: string) => {
  const configs: Record<
    string,
    {
      bg: string;
      text: string;
      border: string;
      icon: typeof CheckCircle2;
      label: string;
    }
  > = {
    ATIVO: {
      bg: "bg-success-bg",
      text: "text-success-text",
      border: "border-success-border",
      icon: CheckCircle2,
      label: "Ativo",
    },
    FINALIZADO: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      border: "border-blue-200",
      icon: CheckCircle2,
      label: "Finalizado",
    },
    CANCELADO: {
      bg: "bg-danger-bg",
      text: "text-danger-text",
      border: "border-danger-border",
      icon: XCircle,
      label: "Cancelado",
    },
  };
  return configs[status.toUpperCase()] || configs.ATIVO;
};

export function EmpenhoTable({
  empenhos,
  formatCurrency,
  onEdit,
  onDelete,
  user,
}: EmpenhoTableProps) {
  const { updateStatus } = useEmpenhos();

  if (empenhos.length === 0) {
    return (
      <div className="py-12 text-center">
        <Layers2 size={48} className="mx-auto text-text-muted mb-4" />
        <p className="text-text-secondary font-medium">
          Nenhum empenho encontrado
        </p>
        <p className="text-text-muted text-sm mt-1">
          Tente ajustar os filtros ou cadastre um novo empenho
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-surface-muted border-b border-border">
          <tr>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
              Empenho
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
              Empresa
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden lg:table-cell">
              Descrição
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
              Prazo
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
              Valor
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
              Status
            </th>
            {(user?.role === "MASTER" || user?.role === "EDITOR") && (
              <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {empenhos.map((empenho) => {
            const status = getStatusConfig(empenho.status);
            const StatusIcon = status.icon;
            const isNearDeadline =
              empenho.status.toLowerCase() === "ativo" &&
              new Date(empenho.endAt) <
                new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);

            return (
              <tr
                key={empenho.id}
                className="hover:bg-surface-muted/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                      <Layers2 size={18} className="text-primary-500" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">
                        {empenho.numero}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {formatDate(empenho.startAt)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-text-muted" />
                    <span className="text-sm text-text-primary">
                      {empenho.company.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-text-secondary hidden lg:table-cell">
                  <p className="truncate max-w-50">{empenho.description}</p>
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <div className="text-sm">
                    <span
                      className={
                        isNearDeadline ? "text-warning-text font-medium" : ""
                      }
                    >
                      {formatDate(empenho.endAt)}
                    </span>
                    {isNearDeadline && (
                      <p className="text-xs text-warning-text">Prazo próximo</p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <p className="font-semibold text-text-primary text-sm">
                    {formatCurrency(empenho.value)}
                  </p>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}
                  >
                    <StatusIcon size={12} />
                    {empenho.status}
                  </span>
                </td>

                {(user?.role === "MASTER" || user?.role === "EDITOR") && (
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(empenho)}
                        className="p-2 hover:bg-primary-100 cursor-pointer text-text-secondary hover:text-primary-500 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(empenho)}
                        className="p-2 hover:bg-danger-bg cursor-pointer text-text-secondary hover:text-danger-text rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() =>
                          updateStatus({
                            status:
                              empenho.status === "ATIVO"
                                ? "FINALIZADO"
                                : "ATIVO",
                            empenhoId: empenho.id,
                          })
                        }
                        className="p-2 hover:bg-emerald-100 cursor-pointer text-text-secondary hover:text-emerald-600 rounded-md transition-colors"
                        title="Concluir"
                      >
                        {empenho.status === "ATIVO" ? (
                          <Check size={16} />
                        ) : (
                          <Play size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
