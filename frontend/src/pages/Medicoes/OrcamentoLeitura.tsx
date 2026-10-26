import { useState } from "react";
import type { PlanilhaOrcamento } from "../../../types/medicao";
import { formatCurrency } from "../../utils/format-currency";
import { formatQuantidade } from "../../utils/decimal";
import { cx } from "../../utils/cx";
import { SearchInput } from "../../components/filters/SearchInput";
import { StatusPill, Table, TableBody, TableFoot, TableHead, Td, Th, Tr } from "../../components/ui";
import { matchesItemSearch } from "./medicao-progress";

// Orçado, medido e saldo de cada item, para quem só consulta (ou com a OS encerrada)
export function OrcamentoLeitura({ planilha }: { planilha: PlanilhaOrcamento }) {
  const { itens, totais } = planilha;
  const [busca, setBusca] = useState("");
  const visiveis = itens.filter((item) => matchesItemSearch(item, busca));

  return (
    <div className="space-y-3 pb-5">
      <SearchInput value={busca} onChange={setBusca} placeholder="Buscar item por código ou descrição..." />
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHead>
            <Th>Item</Th>
            <Th width="w-32" className="hidden md:table-cell">
              Preço unit.
            </Th>
            <Th width="w-36">Orçado</Th>
            <Th width="w-36" className="hidden sm:table-cell">
              Medido
            </Th>
            <Th width="w-36">Saldo</Th>
          </TableHead>
          <TableBody>
            {visiveis.map((item) => (
              <Tr key={item.id} muted={item.completo}>
                <Td>
                  <p className="truncate font-medium text-text-primary" title={item.descricao}>
                    {item.ordem}. {item.descricao}
                  </p>
                  {item.codigo && <p className="text-[11px] text-text-muted truncate">{item.codigo}</p>}
                </Td>
                <Td className="hidden md:table-cell">
                  {formatCurrency(item.precoUnitario)}/{item.unidade}
                </Td>
                <Td>
                  <span className="block">
                    {formatQuantidade(item.quantidade)} {item.unidade}
                  </span>
                  <span
                    className="block text-[11px] text-text-muted"
                    title={item.totalAjustado ? "Total ajustado para bater com a planilha de referência" : undefined}
                  >
                    {formatCurrency(item.valorTotal)}
                    {item.totalAjustado && " (ajustado)"}
                  </span>
                </Td>
                <Td className="hidden sm:table-cell">
                  <span className="block">{formatQuantidade(item.medido)}</span>
                  {item.rascunho > 0 ? (
                    <span
                      className={cx("block text-[11px]", item.excedeSaldo ? "text-danger-text" : "text-text-muted")}
                      title={item.excedeSaldo ? "O rascunho passou do saldo: corrija antes de fechar" : undefined}
                    >
                      +{formatQuantidade(item.rascunho)} no rascunho
                    </span>
                  ) : (
                    <span className="block text-[11px] text-text-muted">{formatCurrency(item.valorMedido)}</span>
                  )}
                </Td>
                <Td>
                  {item.completo ? (
                    <StatusPill tone="success" size="sm">
                      Concluído
                    </StatusPill>
                  ) : (
                    <>
                      <span className="block font-semibold text-text-primary">
                        {formatQuantidade(item.saldo)} {item.unidade}
                      </span>
                      <span className="block text-[11px] text-text-muted">{formatCurrency(item.valorSaldo)}</span>
                    </>
                  )}
                </Td>
              </Tr>
            ))}
          </TableBody>
          {itens.length > 1 && !busca && (
            <TableFoot>
              <Tr>
                <Td>Total</Td>
                <Td className="hidden md:table-cell" />
                <Td>{formatCurrency(totais.valorOrcado)}</Td>
                <Td className="hidden sm:table-cell">{formatCurrency(totais.valorMedido)}</Td>
                <Td>{formatCurrency(totais.valorSaldo)}</Td>
              </Tr>
            </TableFoot>
          )}
        </Table>
        {visiveis.length === 0 && (
          <p className="py-6 text-center text-sm text-text-muted">
            {itens.length === 0 ? "Nenhum orçamento lançado nesta OS." : `Nenhum item encontrado para “${busca}”.`}
          </p>
        )}
      </div>
    </div>
  );
}
