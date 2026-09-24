import {
  ClipboardList,
  FileSignature,
  Trash2,
  Edit2,
  Plus,
  Loader2,
  HardHat,
  AlertTriangle,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { OrdemServico } from "../../../types/ordem-servico";
import { usePermission } from "../../hooks/usePermission";
import { OrdemServicoPagination } from "./OrdemServicoPagination";

const ITEMS_PER_PAGE = 10;

const STATUS_LABEL: Record<OrdemServico["status"], string> = {
  ATIVO: "Ativa",
  FINALIZADO: "Finalizada",
  CANCELADO: "Cancelada",
};

const STATUS_CLASS: Record<OrdemServico["status"], string> = {
  ATIVO: "bg-warning-bg text-warning-text border-warning-border",
  FINALIZADO: "bg-success-bg text-success-text border-success-border",
  CANCELADO: "bg-danger-bg text-danger-text border-danger-border",
};

interface OrdemServicoTableProps {
  ordensServico: OrdemServico[];
  isLoading?: boolean;
  formatCurrency: (value: number) => string;
  onEdit: (ordemServico: OrdemServico) => void;
  onDelete: (ordemServico: OrdemServico) => void;
  onAdd?: () => void;
}

export function OrdemServicoTable({
  ordensServico,
  isLoading = false,
  formatCurrency,
  onEdit,
  onDelete,
  onAdd,
}: OrdemServicoTableProps) {
  const { canEditAdministrativo } = usePermission();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(ordensServico.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrdensServico = useMemo(
    () => ordensServico.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    [ordensServico, startIndex],
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase">
                Ordem de Serviço
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase">
                Empenho / Contrato
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
                Obra vinculada
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase">
                Valor
              </th>
              <th className="text-center py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase">
                Status
              </th>
              {canEditAdministrativo && (
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedOrdensServico.map((os) => (
              <tr key={os.id} className="hover:bg-surface-muted/50 transition-colors">
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                      <ClipboardList size={18} className="text-primary-500" />
                    </div>
                    <p className="font-medium text-text-primary text-sm">{os.numero}</p>
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <FileSignature size={14} className="text-text-muted" />
                    <div>
                      <p className="text-sm text-text-primary">Empenho {os.empenho.numero}</p>
                      <p className="text-xs text-text-secondary">
                        {os.empenho.contrato.identificador} — {os.empenho.contrato.company.name}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4 hidden md:table-cell">
                  {os.obra ? (
                    <div className="inline-flex items-center gap-1.5 text-sm text-text-primary">
                      <HardHat size={14} className="text-text-muted" />
                      {os.obra.nome}
                    </div>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-warning-bg border border-warning-border text-warning-text text-xs font-medium"
                      title="Crie uma obra em Engenharia > Obras e vincule esta ordem de serviço a ela"
                    >
                      <AlertTriangle size={12} />
                      Sem obra — criar e vincular
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-4">
                  <span className="text-sm font-semibold text-text-primary">
                    {formatCurrency(os.valor)}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CLASS[os.status]}`}
                  >
                    {STATUS_LABEL[os.status]}
                  </span>
                </td>

                {canEditAdministrativo && (
                  <td className="py-2.5 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(os)}
                        className="p-2 hover:bg-primary-100 cursor-pointer text-text-secondary hover:text-primary-500 rounded-md transition-colors"
                        title="Gerenciar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(os)}
                        className="p-2 hover:bg-danger-bg cursor-pointer text-text-secondary hover:text-danger-text rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {paginatedOrdensServico.length === 0 &&
        (isLoading ? (
          <div className="py-8 text-center">
            <Loader2 size={32} className="mx-auto text-primary-500 animate-spin mb-3" />
            <p className="text-text-secondary text-sm">Carregando ordens de serviço...</p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <ClipboardList size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-secondary font-medium">Nenhuma ordem de serviço encontrada</p>
            <p className="text-text-muted text-sm mt-1">
              Tente ajustar os filtros ou cadastre uma nova ordem de serviço
            </p>
            {onAdd && (
              <button
                onClick={onAdd}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-md cursor-pointer transition-colors"
              >
                <Plus size={16} />
                Cadastrar ordem de serviço
              </button>
            )}
          </div>
        ))}

      <OrdemServicoPagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={ordensServico.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setPage}
      />
    </div>
  );
}
