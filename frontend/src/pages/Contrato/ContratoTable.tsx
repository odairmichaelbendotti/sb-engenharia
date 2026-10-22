import {
  FileSignature,
  Building2,
  Trash2,
  Edit2,
  Plus,
  Loader2,
  Layers2,
} from "lucide-react";
import {
  Badge,
  Button,
  IconButton,
  Pagination,
  Table,
  TableBody,
  TableHead,
  Td,
  Th,
  Tr,
  type BadgeTone,
} from "../../components/ui";
import { useMemo, useState } from "react";
import type { Contrato } from "../../../types/contrato";
import { usePermission } from "../../hooks/usePermission";
import { SaldoLiquidacao } from "../../components/SaldoLiquidacao";

const ITEMS_PER_PAGE = 10;

const STATUS_LABEL: Record<Contrato["status"], string> = {
  ATIVO: "Ativo",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

const STATUS_TONE: Record<Contrato["status"], BadgeTone> = {
  ATIVO: "warning",
  FINALIZADO: "success",
  CANCELADO: "danger",
};

interface ContratoTableProps {
  contratos: Contrato[];
  isLoading?: boolean;
  onEdit: (contrato: Contrato) => void;
  onDelete: (contrato: Contrato) => void;
  onAdd?: () => void;
}

export function ContratoTable({
  contratos,
  isLoading = false,
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
      <Table>
        <TableHead>
          <Th>Contrato</Th>
          <Th>Empresa</Th>
          <Th className="hidden lg:table-cell">Empenhos</Th>
          <Th>Saldo</Th>
          <Th>Status</Th>
          {canEditAdministrativo && <Th>Ações</Th>}
        </TableHead>
        <TableBody>
          {paginatedContratos.map((contrato) => (
            <Tr key={contrato.id}>
              <Td>
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
                      <p className="font-medium text-text-primary">{contrato.identificador}</p>
                    </div>
                    <p className="text-xs text-text-secondary">{contrato.descricaoCurta}</p>
                  </div>
                </div>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-text-muted" />
                  <span className="text-text-primary">{contrato.company.name}</span>
                </div>
              </Td>
              <Td className="hidden lg:table-cell">
                <div className="flex items-center gap-1 text-text-secondary">
                  <Layers2 size={14} className="text-text-muted" />
                  {contrato.empenhos.length}
                </div>
              </Td>
              <Td>
                <SaldoLiquidacao
                  valor={contrato.valor}
                  liquidado={contrato.valorLiquidado}
                  saldo={contrato.saldoALiquidar}
                  liquidadoLabel="Contrato liquidado"
                />
              </Td>
              <Td>
                <Badge tone={STATUS_TONE[contrato.status]}>{STATUS_LABEL[contrato.status]}</Badge>
              </Td>
              {canEditAdministrativo && (
                <Td>
                  <div className="flex items-center gap-1">
                    <IconButton icon={Edit2} label="Gerenciar" size="sm" onClick={() => onEdit(contrato)} />
                    <IconButton
                      icon={Trash2}
                      label="Excluir"
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(contrato)}
                    />
                  </div>
                </Td>
              )}
            </Tr>
          ))}
        </TableBody>
      </Table>

      {/* Empty State */}
      {paginatedContratos.length === 0 &&
        (isLoading ? (
          <div className="py-8 text-center">
            <Loader2 size={32} className="mx-auto text-text-muted animate-spin mb-3" />
            <p className="text-text-secondary text-sm">
              Carregando contratos...
            </p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <FileSignature size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-sm text-text-secondary font-medium">
              Nenhum contrato encontrado
            </p>
            <p className="text-text-muted text-sm mt-1">
              Tente ajustar os filtros ou cadastre um novo contrato
            </p>
            {onAdd && (
              <Button icon={Plus} onClick={onAdd} className="mt-4">
                Cadastrar contrato
              </Button>
            )}
          </div>
        ))}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={contratos.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="contratos"
        onPageChange={setPage}
      />
    </div>
  );
}
