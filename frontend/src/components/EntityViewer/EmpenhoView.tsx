import { AlignLeft, Building2, CalendarDays, ClipboardList, FileSignature, FileText, Hash, Layers2, Link2, Tag } from "lucide-react";
import { useEmpenhos } from "../../store/empenhos";
import { useContratos } from "../../store/contratos";
import { useOrdensServico } from "../../store/ordensServico";
import { useInvoice } from "../../store/invoices";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { HINT_TEXT, empenhoStatusDisplay, getDeadlineHint, invoiceStatusDisplay, invoiceLabel } from "../../utils/status-display";
import { EMPENHO_CATEGORY_LABEL } from "../../pages/Empenho/empenho-display";
import { ordemServicoStatusDisplay } from "../../pages/OrdemServico/ordem-servico-display";
import {
  CodeTag,
  DetailGrid,
  DetailItem,
  FormSection,
  RelationCard,
  RelationGrid,
  StatTile,
  StatTiles,
  StatusPill,
  Table,
  TableBody,
  TableFoot,
  TableHead,
  Td,
  Th,
  Tr,
} from "../ui";
import { EmptyNote, ViewFrame, type ViewProps } from "./ViewFrame";
import { useViewerNav } from "./useViewerNav";
import { useEnsureData } from "./useEnsureData";

const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

export function EmpenhoView({ id, ...frame }: ViewProps) {
  const { linkTo } = useViewerNav();
  const loading = useEnsureData("empenhos");
  useEnsureData("contratos");
  useEnsureData("ordensServico");
  useEnsureData("invoices");

  const empenho = useEmpenhos((s) => s.data?.empenhos.find((e) => e.id === id));
  const contrato = useContratos((s) => s.data?.contratos.find((c) => c.id === empenho?.contrato_id));
  const ordens = useOrdensServico((s) => s.data?.ordensServico);
  const invoices = useInvoice((s) => s.allInvoices);

  if (!empenho) return <ViewFrame {...frame} loading={loading} notFound={!loading} />;

  const status = empenhoStatusDisplay(empenho.status, String(empenho.endAt));
  const active = empenho.status.toUpperCase() === "ATIVO";
  const vigencia = getDeadlineHint(String(empenho.endAt), { active });
  // OS financiadas por este empenho, com o quanto cada uma recebeu dele
  const ordensDoEmpenho = (ordens ?? []).flatMap((os) => {
    const vinculo = os.empenhos.find((v) => v.empenho_id === empenho.id);
    return vinculo ? [{ os, vinculo }] : [];
  });
  const notas = invoices
    .filter((i) => i.empenho_id === empenho.id)
    .sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());
  const { company } = empenho.contrato;

  return (
    <ViewFrame
      {...frame}
      accent={contrato?.cor}
      eyebrow={
        <>
          <CodeTag>{empenho.numero}</CodeTag>
          <StatusPill tone={status.tone} title={status.title}>
            {status.label}
          </StatusPill>
          <span className="truncate">
            {company.name} <span className="text-text-muted">·</span> {empenho.contrato.identificador}
          </span>
        </>
      }
      title={empenho.description}
      editLabel="Editar empenho"
    >
      <StatTiles>
        <StatTile label="Valor empenhado" value={formatCurrency(empenho.value)} hint={EMPENHO_CATEGORY_LABEL[empenho.category]} />
        <StatTile
          label="Destinado a OS"
          value={formatCurrency(empenho.valorComprometido)}
          hint={`${pct(empenho.valorComprometido, empenho.value)}% · ${ordensDoEmpenho.length} OS`}
        />
        <StatTile
          label="Liquidado"
          value={formatCurrency(empenho.valorLiquidado)}
          hint={`${pct(empenho.valorLiquidado, empenho.value)}% · a liquidar ${formatCurrency(Math.max(0, empenho.saldoALiquidar))}`}
        />
        <StatTile
          label="Livre para novas OS"
          value={formatCurrency(Math.max(0, empenho.saldoDisponivel))}
          valueTone={empenho.saldoDisponivel < 0 ? "danger" : "default"}
          hint={empenho.saldoDisponivel < 0 ? "OS acima do valor do empenho" : undefined}
          hintTone="danger"
        />
      </StatTiles>

      <FormSection title="Dados do empenho" icon={Layers2}>
        <DetailGrid>
          <DetailItem icon={Hash} label="Número">
            {empenho.numero}
          </DetailItem>
          <DetailItem icon={Tag} label="Categoria">
            {EMPENHO_CATEGORY_LABEL[empenho.category] ?? "—"}
          </DetailItem>
          <DetailItem icon={CalendarDays} label="Vigência">
            {formatDateOnly(empenho.startAt)} a {formatDateOnly(empenho.endAt)}
            {vigencia && (
              <span className={`block text-xs ${HINT_TEXT[vigencia.tone]}`}>{vigencia.label}</span>
            )}
          </DetailItem>
          <DetailItem icon={AlignLeft} label="Descrição" long className="sm:col-span-2 lg:col-span-3">
            {empenho.description}
          </DetailItem>
        </DetailGrid>
      </FormSection>

      <FormSection title="Vínculos" icon={Link2}>
        <RelationGrid>
          <RelationCard
            icon={FileSignature}
            label="Contrato"
            title={empenho.contrato.identificador}
            color={contrato?.cor}
            hint={empenho.contrato.descricaoCurta}
            onClick={linkTo("contrato", empenho.contrato_id)}
          />
          <RelationCard
            icon={Building2}
            label="Empresa"
            title={company.name}
            onClick={linkTo("empresa", company.id)}
          />
        </RelationGrid>
      </FormSection>

      <FormSection title="Ordens de serviço deste empenho" icon={ClipboardList} count={ordensDoEmpenho.length}>
        {ordensDoEmpenho.length === 0 ? (
          <EmptyNote>Nenhuma ordem de serviço usa este empenho.</EmptyNote>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table compact>
              <TableHead>
                <Th>Ordem de serviço</Th>
                <Th>Status</Th>
                <Th>Neste empenho</Th>
                <Th>Liquidado</Th>
              </TableHead>
              <TableBody>
                {ordensDoEmpenho.map(({ os, vinculo }) => {
                  const osStatus = ordemServicoStatusDisplay(os);
                  return (
                    <Tr key={os.id} onOpen={linkTo("ordemServico", os.id)} muted={os.status === "CANCELADO"}>
                      <Td>
                        <span className="block font-semibold text-text-primary line-clamp-1">
                          {os.obra?.nome ?? os.empenho.description}
                        </span>
                        <CodeTag className="mt-0.5">{os.numero}</CodeTag>
                      </Td>
                      <Td>
                        <StatusPill tone={osStatus.tone} size="sm">
                          {osStatus.label}
                        </StatusPill>
                      </Td>
                      <Td>{formatCurrency(vinculo.valor)}</Td>
                      <Td>{formatCurrency(vinculo.liquidado)}</Td>
                    </Tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </FormSection>

      <FormSection title="Notas fiscais" icon={FileText} count={notas.length}>
        {notas.length === 0 ? (
          <EmptyNote>Nenhuma nota fiscal lançada neste empenho.</EmptyNote>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table compact>
              <TableHead>
                <Th>Nota</Th>
                <Th>Status</Th>
                <Th>Vencimento</Th>
                <Th>Valor</Th>
              </TableHead>
              <TableBody>
                {notas.map((nf) => {
                  const nfStatus = invoiceStatusDisplay(nf.status);
                  return (
                    <Tr key={nf.id} onOpen={linkTo("invoice", nf.id)} muted={nf.status.toUpperCase() === "CANCELADO"}>
                      <Td>
                        <span className="font-semibold text-text-primary">{invoiceLabel(nf.numero)}</span>
                        {nf.ordemServico && <span className="block text-[11px] text-text-muted">{nf.ordemServico.numero}</span>}
                      </Td>
                      <Td>
                        <StatusPill tone={nfStatus.tone} size="sm">
                          {nfStatus.label}
                        </StatusPill>
                      </Td>
                      <Td>{formatDateOnly(nf.vencimento)}</Td>
                      <Td>{formatCurrency(nf.value)}</Td>
                    </Tr>
                  );
                })}
              </TableBody>
              <TableFoot>
                <Tr>
                  <Td>Liquidado</Td>
                  <Td />
                  <Td />
                  <Td>{formatCurrency(empenho.valorLiquidado)}</Td>
                </Tr>
              </TableFoot>
            </Table>
          </div>
        )}
      </FormSection>
    </ViewFrame>
  );
}
