import { Fragment, useState } from "react";
import type { MedicaoDetalhe, MedicaoLinha } from "../../../types/medicao";
import { formatCurrency, formatDateOnly, formatDateTimeFull } from "../../utils/format-currency";
import { formatQuantidade } from "../../utils/decimal";
import { Button, DetailItem, StatTile, StatusPill, Table, TableBody, TableFoot, TableGroupRow, TableHead, Td, Th, Tr } from "../../components/ui";
import { contagemItens, gruposPorEtapa, SEM_ETAPA, temEtapas, useEtapasRecolhidas } from "./etapas";
import { SupressaoNota } from "./supressao";
import { matchesItemSearch } from "./medicao-progress";
import { medicaoTitulo } from "../OrdemServico/medicao-display";
import { correspondeFiltroMedicao, type FiltroMedicao } from "./medicao-filters";
import { MedicaoItemFilters } from "./MedicaoItemFilters";

/**
 * Medição fechada (ou vista por quem não edita): a planilha como foi fechada. `compact` para o
 * modal da OS; na tela de medições a tabela ocupa a largura toda.
 */
export function MedicaoLeitura({ detalhe, compact = false }: { detalhe: MedicaoDetalhe; compact?: boolean }) {
  const [filtro, setFiltro] = useState<FiltroMedicao>("nesta");
  const [busca, setBusca] = useState("");
  const medidas = detalhe.linhas.filter((l) => correspondeFiltroMedicao(l, filtro) && matchesItemSearch(l, busca));
  const pendentes = detalhe.linhas.filter((l) => l.saldo > 0).length;
  const nesta = detalhe.linhas.filter((l) => l.esta > 0).length;
  const grupos = gruposPorEtapa(medidas, (l) => l.etapa);
  const comEtapas = temEtapas(grupos);
  const etapas = useEtapasRecolhidas(`${filtro}:${busca}`);
  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-text-primary">{medicaoTitulo(detalhe.numero)}</h2>
          <StatusPill tone={detalhe.status === "FECHADA" ? "success" : "warning"} size="sm">
            {detalhe.status === "FECHADA" ? "Fechada · somente leitura" : "Rascunho · somente leitura"}
          </StatusPill>
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          {detalhe.status === "FECHADA"
            ? "Quantidades e saldos na data do fechamento. Medições posteriores não estão incluídas neste saldo."
            : "Quantidades deste rascunho. Elas só entram no acumulado da OS após o fechamento."}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <StatTile label="Já medido antes" value={formatCurrency(detalhe.totais.valorAnterior)} hint="Medições anteriores fechadas" />
        <StatTile label="Nesta medição" value={formatCurrency(detalhe.totais.valorEsta)} hint={`${contagemItens(nesta)} com quantidade lançada`} />
        <StatTile label="Falta após esta medição" value={formatCurrency(detalhe.totais.valorSaldo)}
          hint={`${contagemItens(pendentes)} com saldo restante`} valueTone={pendentes === 0 ? "success" : "default"} />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
        <DetailItem label="Período">
          {formatDateOnly(detalhe.periodoInicio)} a {formatDateOnly(detalhe.periodoFim)}
        </DetailItem>
        <DetailItem label="Lançada por">{detalhe.criadoPorNome}</DetailItem>
      </div>

      <MedicaoItemFilters filtro={filtro} onFiltro={setFiltro} busca={busca} onBusca={setBusca}
        pendentes={pendentes} nesta={nesta} todos={detalhe.linhas.length} visiveis={medidas.length} leitura />

      <div className="hidden md:block bg-surface rounded-xl border border-border overflow-hidden">
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
            <Th width="w-28">Falta após esta</Th>
          </TableHead>
          <TableBody>
            {grupos.map((grupo) => {
              const aberta = etapas.aberta(grupo.key);
              return (
                <Fragment key={grupo.key}>
                  {comEtapas && (
                    <TableGroupRow
                      columns={[undefined, "hidden sm:table-cell", undefined, "hidden sm:table-cell", undefined]}
                      title={grupo.etapa ?? SEM_ETAPA}
                      count={contagemItens(grupo.itens.length)}
                      values={[undefined, undefined, formatCurrency(grupo.itens.reduce((acc, l) => acc + l.valorEsta, 0))]}
                      open={aberta}
                      onToggle={() => etapas.alternar(grupo.key)}
                    />
                  )}
                  {aberta && grupo.itens.map((l) => <LinhaMedida key={l.item_id} l={l} />)}
                </Fragment>
              );
            })}
          </TableBody>
          <TableFoot>
            <Tr>
              <Td>{busca.trim() || filtro === "pendentes" ? "Subtotal dos itens exibidos" : "Total desta medição"}</Td>
              <Td className="hidden sm:table-cell" />
              <Td>{formatCurrency(medidas.reduce((acc, l) => acc + l.valorEsta, 0))}</Td>
              <Td className="hidden sm:table-cell" />
              <Td />
            </Tr>
          </TableFoot>
        </Table>
      </div>
      <div className="md:hidden space-y-3">
        {grupos.map((grupo) => (
          <div key={grupo.key} className="space-y-2">
            {comEtapas && <h3 className="text-xs font-semibold text-text-secondary">{grupo.etapa ?? SEM_ETAPA} · {contagemItens(grupo.itens.length)}</h3>}
            {grupo.itens.map((l) => (
              <div key={l.item_id} className="bg-surface border border-border rounded-xl p-3 space-y-2">
                <p className="text-sm font-medium text-text-primary break-words">{l.descricao}</p>
                <p className="text-xs text-text-muted">{[l.codigo, `${formatQuantidade(l.orcado)} ${l.unidade} orçados`].filter(Boolean).join(" · ")}</p>
                <SupressaoNota suprimido={l.suprimido ?? 0} unidade={l.unidade} />
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div><dt className="text-text-secondary">Já medido antes</dt><dd className="text-text-primary">{formatQuantidade(l.anterior)} {l.unidade}</dd></div>
                  <div><dt className="text-text-secondary">Nesta medição</dt><dd className="font-semibold text-text-primary">{formatQuantidade(l.esta)} {l.unidade} · {formatCurrency(l.valorEsta)}</dd></div>
                  <div><dt className="text-text-secondary">Acumulado</dt><dd className="text-text-primary">{formatQuantidade(l.acumulado)} {l.unidade}</dd></div>
                  <div><dt className="text-text-secondary">Falta após esta</dt><dd className="font-semibold text-text-primary">{l.saldo <= 0 ? (l.orcado === 0 && (l.suprimido ?? 0) > 0 ? "Suprimido" : "Concluído") : `${formatQuantidade(l.saldo)} ${l.unidade}`}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        ))}
      </div>
      {medidas.length === 0 && (
        <div className="rounded-xl border border-border bg-surface px-4 py-6 text-center space-y-2">
          <p className="text-sm font-medium text-text-primary">
            {busca.trim() ? "Nenhum item corresponde à busca neste filtro." : filtro === "pendentes" ? "Não havia saldo restante após esta medição." : "Nenhum item lançado nesta medição."}
          </p>
          <Button variant="secondary" size="sm" onClick={() => { setBusca(""); setFiltro("todos"); }}>Ver todos os itens</Button>
        </div>
      )}
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

// Item medido nesta medição: anterior, esta, acumulado e saldo
function LinhaMedida({ l }: { l: MedicaoLinha }) {
  return (
    <Tr>
      <Td>
        <span className="block text-text-primary line-clamp-2" title={l.descricao}>
          {l.descricao}
        </span>
        <span className="block text-[11px] text-text-muted">
          {[l.codigo, `${formatQuantidade(l.orcado)} ${l.unidade} orçados`].filter(Boolean).join(" · ")}
        </span>
        <SupressaoNota suprimido={l.suprimido ?? 0} unidade={l.unidade} />
      </Td>
      <Td className="hidden sm:table-cell">{formatQuantidade(l.anterior)}</Td>
      <Td>
        <span className="block font-semibold text-text-primary">
          {formatQuantidade(l.esta)} {l.unidade}
        </span>
        <span className="block text-[11px] text-text-muted">{formatCurrency(l.valorEsta)}</span>
      </Td>
      <Td className="hidden sm:table-cell">{formatQuantidade(l.acumulado)}</Td>
      <Td>{l.saldo <= 0 ? (l.orcado === 0 && (l.suprimido ?? 0) > 0 ? "Suprimido" : "Concluído") : `${formatQuantidade(l.saldo)} ${l.unidade}`}</Td>
    </Tr>
  );
}
