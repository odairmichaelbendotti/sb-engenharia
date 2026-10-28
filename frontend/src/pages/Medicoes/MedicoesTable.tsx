import { useMemo, useState } from "react";
import { Eye, FileDown, Hotel, ListChecks, Loader2, Ruler, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { PainelMedicaoItem } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";
import { useEntityViewer } from "../../store/entityViewer";
import { downloadBlob } from "../../utils/download-file";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { cx } from "../../utils/cx";
import { OrdemServicoNumeroTag } from "../../components/OrdemServicoNumeroTag";
import {
  ActionMenu,
  Button,
  IconButton,
  Pagination,
  StatusPill,
  Table,
  TableBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "../../components/ui";
import { medicaoFilename, medicaoTitulo } from "../OrdemServico/medicao-display";
import { MedidoCell } from "./MedidoCell";
import { percent } from "./medicao-progress";
import {
  acaoMedicao,
  acaoOrcamento,
  painelRitmo,
  painelTitulo,
  SEM_LOTE_DICA,
  type PainelAcao,
} from "./painel-display";

const ITEMS_PER_PAGE = 10;

interface MedicoesTableProps {
  items: PainelMedicaoItem[];
  isLoading: boolean;
}

/**
 * Uma linha por OS: obra e OS vinculada, orçamento, quanto já foi medido, a última medição e os
 * atalhos para as telas de orçamento e de medição. Clicar na linha abre a OS.
 */
export function MedicoesTable({ items, isLoading }: MedicoesTableProps) {
  const navigate = useNavigate();
  const openViewer = useEntityViewer((s) => s.open);
  const fetchMedicaoDocument = useMedicoes((s) => s.fetchMedicaoDocument);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = useMemo(() => items.slice(startIndex, startIndex + ITEMS_PER_PAGE), [items, startIndex]);

  async function baixarUltima(item: PainelMedicaoItem) {
    if (!item.ultimaFechada) return;
    try {
      downloadBlob(
        await fetchMedicaoDocument(item.ultimaFechada.id),
        medicaoFilename(item.ultimaFechada.numero, item.numero),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar o PDF da medição");
    }
  }

  return (
    <div>
      <Table>
        <TableHead>
          <Th>Obra · OS</Th>
          <Th width="w-36" className="hidden lg:table-cell">
            Orçamento
          </Th>
          <Th width="w-48" className="hidden lg:table-cell">
            Medido
          </Th>
          <Th width="w-36" className="hidden xl:table-cell">
            Última medição
          </Th>
          <Th width="w-24 xl:w-64">Lançar</Th>
          <Th actions />
        </TableHead>
        <TableBody>
          {paginated.map((item) => {
            const titulo = painelTitulo(item);
            const orcamento = acaoOrcamento(item);
            const medicao = acaoMedicao(item);
            const valorRascunho = item.rascunho?.valor ?? 0;
            return (
              <Tr
                key={item.id}
                onOpen={() => openViewer({ kind: "ordemServico", id: item.id })}
                muted={item.status !== "ATIVO"}
              >
                <Td accent={item.contrato.cor}>
                  <p
                    className={cx("truncate", item.obra ? "font-semibold text-text-primary" : "font-medium text-text-secondary")}
                    title={titulo}
                  >
                    {titulo}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-[11px] text-text-muted min-w-0">
                    <OrdemServicoNumeroTag numero={item.numero} />
                    <span className="truncate" title={`${item.empresa.name} · ${item.contrato.identificador}`}>
                      {item.empresa.name} · {item.contrato.identificador}
                    </span>
                    {item.semLote && (
                      <span className="text-warning-text" title={SEM_LOTE_DICA}>
                        sem lote · desconto 0%
                      </span>
                    )}
                    {/* Sem as colunas de orçamento e medido, o essencial delas fica aqui */}
                    <span className="lg:hidden tabular-nums">
                      {item.itens === 0
                        ? "sem orçamento"
                        : `${formatCurrency(item.valorOrcado)} · ${percent(item.valorMedido / item.valorOrcado)}% medido`}
                    </span>
                    {item.rascunho && (
                      <span className="xl:hidden">
                        <StatusPill tone="warning" size="sm">
                          {medicaoTitulo(item.rascunho.numero)} em rascunho
                        </StatusPill>
                      </span>
                    )}
                  </div>
                </Td>
                <Td className="hidden lg:table-cell">
                  {item.itens === 0 ? (
                    <span className="text-text-muted">Sem orçamento</span>
                  ) : (
                    <span className="inline-flex flex-col">
                      <span className="font-semibold text-text-primary tabular-nums">{formatCurrency(item.valorOrcado)}</span>
                      <span className="text-[11px] text-text-muted">
                        {item.itens} {item.itens === 1 ? "item" : "itens"}
                      </span>
                      {item.divergencia && (
                        <span
                          className="text-[11px] text-warning-text"
                          title={`Soma dos itens ${item.divergencia.diferenca > 0 ? "acima" : "abaixo"} do valor da OS (${formatCurrency(item.valorOs)}) em ${formatCurrency(Math.abs(item.divergencia.diferenca))}`}
                        >
                          difere do valor da OS
                        </span>
                      )}
                    </span>
                  )}
                </Td>
                <Td className="hidden lg:table-cell">
                  <MedidoCell
                    valorOrcado={item.valorOrcado}
                    valorMedido={item.valorMedido}
                    valorRascunho={valorRascunho}
                    ritmo={painelRitmo(item)}
                  />
                </Td>
                <Td className="hidden xl:table-cell">
                  {item.rascunho ? (
                    <span className="inline-flex flex-col items-center">
                      <StatusPill tone="warning" size="sm" title="Em elaboração: ainda não entra no acumulado">
                        {String(item.rascunho.numero).padStart(2, "0")} · rascunho
                      </StatusPill>
                      <span className="text-[11px] text-text-muted tabular-nums mt-0.5">
                        {formatCurrency(item.rascunho.valor)}
                      </span>
                    </span>
                  ) : item.ultimaFechada ? (
                    <span className="inline-flex flex-col">
                      <span className="text-text-primary">{medicaoTitulo(item.ultimaFechada.numero)}</span>
                      <span className="text-[11px] text-text-muted">até {formatDateOnly(item.ultimaFechada.periodoFim)}</span>
                    </span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </Td>
                <Td>
                  {/* Os atalhos não abrem a linha */}
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <RowShortcut acao={orcamento} icon={ListChecks} onGo={navigate} />
                    <RowShortcut acao={medicao} icon={Ruler} onGo={navigate} />
                  </div>
                </Td>
                <Td actions>
                  <ActionMenu
                    label={`Ações da OS ${item.numero}`}
                    items={[
                      { label: "Visualizar OS", icon: Eye, onClick: () => openViewer({ kind: "ordemServico", id: item.id }) },
                      {
                        label: "Visualizar obra",
                        icon: Hotel,
                        onClick: () => item.obra && openViewer({ kind: "obra", id: item.obra.id }),
                        hidden: !item.obra,
                      },
                      {
                        label: "Baixar PDF da última medição",
                        icon: FileDown,
                        onClick: () => void baixarUltima(item),
                        hidden: !item.ultimaFechada,
                      },
                    ]}
                  />
                </Td>
              </Tr>
            );
          })}
        </TableBody>
      </Table>

      {paginated.length === 0 &&
        (isLoading ? (
          <div className="py-10 text-center">
            <Loader2 size={28} className="mx-auto text-text-muted animate-spin mb-2" />
            <p className="text-text-secondary text-sm">Carregando medições...</p>
          </div>
        ) : (
          <div className="py-10 text-center">
            <Ruler size={28} className="mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-secondary font-medium">Nenhuma ordem de serviço encontrada</p>
            <p className="text-text-muted text-xs mt-1">Tente ajustar os filtros ou a busca</p>
          </div>
        ))}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={items.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="ordens de serviço"
        onPageChange={setPage}
      />
    </div>
  );
}

// Atalho da linha: botão com texto a partir de xl, só o ícone antes disso
function RowShortcut({
  acao,
  icon,
  onGo,
}: {
  acao: PainelAcao;
  icon: LucideIcon;
  onGo: (to: string) => void;
}) {
  const go = () => acao.to && onGo(acao.to);
  return (
    <>
      <span className="xl:hidden">
        <IconButton
          icon={icon}
          label={acao.title}
          variant="secondary"
          size="sm"
          disabled={!acao.to}
          onClick={go}
        />
      </span>
      <span className="hidden xl:inline-flex">
        <Button
          variant="secondary"
          size="sm"
          icon={icon}
          disabled={!acao.to}
          title={acao.title}
          onClick={go}
        >
          {acao.label}
        </Button>
      </span>
    </>
  );
}
