import { Fragment, useState } from "react";
import type { OrcamentoItem, PlanilhaOrcamento } from "../../../types/medicao";
import { formatCurrency } from "../../utils/format-currency";
import { formatQuantidade } from "../../utils/decimal";
import { cx } from "../../utils/cx";
import { SearchInput } from "../../components/filters/SearchInput";
import { StatusPill, Table, TableBody, TableFoot, TableGroupRow, TableHead, Td, Th, Tr } from "../../components/ui";
import { matchesItemSearch } from "./medicao-progress";
import { contagemItens, gruposPorEtapa, SEM_ETAPA, temEtapas, useEtapasRecolhidas } from "./etapas";

// Orçado, medido e saldo de cada item, para quem só consulta (ou com a OS encerrada)
export function OrcamentoLeitura({ planilha }: { planilha: PlanilhaOrcamento }) {
  const { itens, totais } = planilha;
  const [busca, setBusca] = useState("");
  const visiveis = itens.filter((item) => matchesItemSearch(item, busca));
  const grupos = gruposPorEtapa(visiveis, (item) => item.etapa);
  const comEtapas = temEtapas(grupos);
  const etapas = useEtapasRecolhidas(busca !== "");

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
            {grupos.map((grupo) => {
              const soma = (campo: "valorTotal" | "valorMedido" | "valorSaldo") =>
                formatCurrency(grupo.itens.reduce((acc, i) => acc + i[campo], 0));
              const aberta = etapas.aberta(grupo.key);
              return (
                <Fragment key={grupo.key}>
                  {comEtapas && (
                    <TableGroupRow
                      columns={[undefined, "hidden md:table-cell", undefined, "hidden sm:table-cell", undefined]}
                      title={grupo.etapa ?? SEM_ETAPA}
                      count={contagemItens(grupo.itens.length)}
                      values={[undefined, undefined, soma("valorTotal"), soma("valorMedido"), soma("valorSaldo")]}
                      open={aberta}
                      onToggle={() => etapas.alternar(grupo.key)}
                    />
                  )}
                  {aberta && grupo.itens.map((item) => <LinhaItem key={item.id} item={item} />)}
                </Fragment>
              );
            })}
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

// Orçado, medido e saldo de um item
function LinhaItem({ item }: { item: OrcamentoItem }) {
  return (
    <Tr muted={item.completo}>
      <Td>
        <p className="truncate font-medium text-text-primary" title={item.descricao}>
          {item.ordem}. {item.descricao}
        </p>
        {item.codigo && <p className="text-[11px] text-text-muted truncate">{item.codigo}</p>}
      </Td>
      <Td className="hidden md:table-cell">
        <span className="block">
          {formatCurrency(item.precoUnitario)}/{item.unidade}
        </span>
        {item.precoReferencia !== null && (
          <span
            className="block text-[11px] text-text-muted"
            title="Preço com BDI; o que vale tem o desconto da OS"
          >
            c/ BDI {formatCurrency(item.precoReferencia)}
          </span>
        )}
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
  );
}
