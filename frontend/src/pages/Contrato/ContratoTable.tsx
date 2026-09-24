import {
  FileSignature,
  Building2,
  Trash2,
  Edit2,
  Plus,
  Loader2,
  Layers2,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Contrato } from "../../../types/contrato";
import { formatDate } from "../../utils/format-currency";
import { usePermission } from "../../hooks/usePermission";
import { ContratoPagination } from "./ContratoPagination";

const ITEMS_PER_PAGE = 10;

const STATUS_LABEL: Record<Contrato["status"], string> = {
  ATIVO: "Ativo",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

const STATUS_CLASS: Record<Contrato["status"], string> = {
  ATIVO: "bg-warning-bg text-warning-text border-warning-border",
  FINALIZADO: "bg-success-bg text-success-text border-success-border",
  CANCELADO: "bg-danger-bg text-danger-text border-danger-border",
};

interface ContratoTableProps {
  contratos: Contrato[];
  isLoading?: boolean;
  formatCurrency: (value: number) => string;
  onEdit: (contrato: Contrato) => void;
  onDelete: (contrato: Contrato) => void;
  onAdd?: () => void;
}

export function ContratoTable({
  contratos,
  isLoading = false,
  formatCurrency,
  onEdit,
  onDelete,
  onAdd,
}: ContratoTableProps) {
  const { canEditAdministrativo } = usePermission();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(contratos.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedContratos = useMemo(
    () => contratos.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    [contratos, startIndex],
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase">
                Contrato
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase">
                Empresa
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
                Vigência
              </th>
              <th className="text-center py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase hidden lg:table-cell">
                Empenhos
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase">
                Saldo
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
            {paginatedContratos.map((contrato) => (
              <tr
                key={contrato.id}
                className="hover:bg-surface-muted/50 transition-colors"
              >
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${contrato.cor}1a` }}
                      title="Cor deste contrato no mapa de obras"
                    >
                      <FileSignature size={18} style={{ color: contrato.cor }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: contrato.cor }} />
                        <p className="font-medium text-text-primary text-sm">
                          {contrato.identificador}
                        </p>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {contrato.descricaoCurta}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-text-muted" />
                    <span className="text-sm text-text-primary">
                      {contrato.company.name}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-4 hidden md:table-cell">
                  <p className="text-sm text-text-secondary">
                    {formatDate(contrato.dataInicio)} — {formatDate(contrato.dataFim)}
                  </p>
                </td>
                <td className="py-2.5 px-4 text-center hidden lg:table-cell">
                  <div className="inline-flex items-center gap-1 text-sm text-text-secondary">
                    <Layers2 size={14} className="text-text-muted" />
                    {contrato.empenhos.length}
                  </div>
                </td>
                <td className="py-2.5 px-4 min-w-40">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span
                        className={`font-semibold ${contrato.saldoDisponivel <= 0 ? "text-danger-text" : "text-text-primary"}`}
                      >
                        {formatCurrency(contrato.saldoDisponivel)}
                      </span>
                      <span className="text-text-muted shrink-0">de {formatCurrency(contrato.valor)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          contrato.saldoDisponivel <= 0
                            ? "bg-danger-text"
                            : contrato.valorEmpenhado / contrato.valor >= 0.8
                              ? "bg-warning-text"
                              : "bg-primary-500"
                        }`}
                        style={{ width: `${Math.min(100, (contrato.valorEmpenhado / contrato.valor) * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CLASS[contrato.status]}`}
                  >
                    {STATUS_LABEL[contrato.status]}
                  </span>
                </td>

                {canEditAdministrativo && (
                  <td className="py-2.5 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(contrato)}
                        className="p-2 hover:bg-primary-100 cursor-pointer text-text-secondary hover:text-primary-500 rounded-md transition-colors"
                        title="Gerenciar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(contrato)}
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
      {paginatedContratos.length === 0 &&
        (isLoading ? (
          <div className="py-8 text-center">
            <Loader2
              size={32}
              className="mx-auto text-primary-500 animate-spin mb-3"
            />
            <p className="text-text-secondary text-sm">
              Carregando contratos...
            </p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <FileSignature size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-secondary font-medium">
              Nenhum contrato encontrado
            </p>
            <p className="text-text-muted text-sm mt-1">
              Tente ajustar os filtros ou cadastre um novo contrato
            </p>
            {onAdd && (
              <button
                onClick={onAdd}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-md cursor-pointer transition-colors"
              >
                <Plus size={16} />
                Cadastrar contrato
              </button>
            )}
          </div>
        ))}

      <ContratoPagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={contratos.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setPage}
      />
    </div>
  );
}
