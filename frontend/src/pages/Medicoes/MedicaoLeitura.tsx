import type { MedicaoDetalhe } from "../../../types/medicao";
import { formatCurrency, formatDateOnly, formatDateTimeFull } from "../../utils/format-currency";
import { formatQuantidade } from "../../utils/decimal";
import { DetailItem, Table, TableBody, TableFoot, TableHead, Td, Th, Tr } from "../../components/ui";

/**
 * Medição fechada (ou vista por quem não edita): a planilha como foi fechada. `compact` para o
 * modal da OS; na tela de medições a tabela ocupa a largura toda.
 */
export function MedicaoLeitura({ detalhe, compact = false }: { detalhe: MedicaoDetalhe; compact?: boolean }) {
  const medidas = detalhe.linhas.filter((l) => l.esta > 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3.5">
        <DetailItem label="Período">
          {formatDateOnly(detalhe.periodoInicio)} a {formatDateOnly(detalhe.periodoFim)}
        </DetailItem>
        <DetailItem label="Acumulado com esta">{formatCurrency(detalhe.totais.valorAcumulado)}</DetailItem>
        <DetailItem label="Saldo a medir">{formatCurrency(detalhe.totais.valorSaldo)}</DetailItem>
        <DetailItem label="Lançada por">{detalhe.criadoPorNome}</DetailItem>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <Table compact={compact}>
          <TableHead>
            <Th>Item</Th>
            <Th width="w-32" className="hidden sm:table-cell">
              Anterior
            </Th>
            <Th width="w-36">Esta medição</Th>
            <Th width="w-32" className="hidden sm:table-cell">
              Acumulado
            </Th>
            <Th width="w-28">Saldo</Th>
          </TableHead>
          <TableBody>
            {medidas.map((l) => (
              <Tr key={l.item_id}>
                <Td>
                  <span className="block text-text-primary line-clamp-2" title={l.descricao}>
                    {l.descricao}
                  </span>
                  <span className="block text-[11px] text-text-muted">
                    {[l.codigo, `${formatQuantidade(l.orcado)} ${l.unidade} orçados`].filter(Boolean).join(" · ")}
                  </span>
                </Td>
                <Td className="hidden sm:table-cell">{formatQuantidade(l.anterior)}</Td>
                <Td>
                  <span className="block font-semibold text-text-primary">
                    {formatQuantidade(l.esta)} {l.unidade}
                  </span>
                  <span className="block text-[11px] text-text-muted">{formatCurrency(l.valorEsta)}</span>
                </Td>
                <Td className="hidden sm:table-cell">{formatQuantidade(l.acumulado)}</Td>
                <Td>{l.saldo <= 0 ? "Concluído" : formatQuantidade(l.saldo)}</Td>
              </Tr>
            ))}
          </TableBody>
          <TableFoot>
            <Tr>
              <Td>Total desta medição</Td>
              <Td className="hidden sm:table-cell" />
              <Td>{formatCurrency(detalhe.totais.valorEsta)}</Td>
              <Td className="hidden sm:table-cell" />
              <Td />
            </Tr>
          </TableFoot>
        </Table>
      </div>
      {detalhe.observacao && (
        <div>
          <p className="text-xs text-text-muted mb-1">Observações</p>
          <p className="text-sm text-text-primary whitespace-pre-line">{detalhe.observacao}</p>
        </div>
      )}
      {detalhe.status === "FECHADA" && detalhe.fechadaEm && (
        <p className="text-xs text-text-muted">
          Fechada em {formatDateTimeFull(detalhe.fechadaEm)} por {detalhe.fechadaPorNome ?? "—"}.
        </p>
      )}
      {detalhe.reabertaEm && (
        <p className="text-xs text-text-muted">
          Reaberta em {formatDateTimeFull(detalhe.reabertaEm)} por {detalhe.reabertaPorNome ?? "—"}.
        </p>
      )}
    </div>
  );
}
