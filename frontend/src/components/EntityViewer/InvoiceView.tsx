import { useState } from "react";
import { AlertTriangle, AlignLeft, Building2, CalendarClock, CheckCircle2, ClipboardList, FileSignature, FileText, Hash, Layers2, Link2 } from "lucide-react";
import { useInvoice } from "../../store/invoices";
import { useEmpenhos } from "../../store/empenhos";
import { useContratos } from "../../store/contratos";
import { usePermission } from "../../hooks/usePermission";
import { formatCurrency, formatDate, formatDateOnly } from "../../utils/format-currency";
import { maskCnpj } from "../../utils/masks";
import { getDeadlineHint, invoiceStatusDisplay, invoiceLabel } from "../../utils/status-display";
import {
  Button,
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
import type { Invoice } from "../../../types/invoice";
import { MarkPaidDialog } from "../../pages/Invoice/MarkPaidDialog";

const isOpenStatus = (status: string) => ["PENDENTE", "VENCIDO"].includes(status.toUpperCase());

// Dica do vencimento: só corre enquanto a nota não foi paga nem cancelada
function vencimentoHint(invoice: Invoice) {
  return getDeadlineHint(invoice.vencimento, { active: isOpenStatus(invoice.status), dueSoonDays: 10 });
}

export function InvoiceView({ id, ...frame }: ViewProps) {
  const { canEditAdministrativo } = usePermission();
  const { linkTo } = useViewerNav();
  const loadingInvoices = useEnsureData("invoices");
  useEnsureData("empenhos");
  useEnsureData("contratos");

  const invoices = useInvoice((s) => s.allInvoices);
  const invoice = invoices.find((i) => i.id === id);
  const empenho = useEmpenhos((s) => s.data?.empenhos.find((e) => e.id === invoice?.empenho_id));
  const contratoId = empenho?.contrato_id ?? invoice?.empenho?.contrato?.id;
  const contrato = useContratos((s) => s.data?.contratos.find((c) => c.id === contratoId));
  const [confirmingPaid, setConfirmingPaid] = useState(false);

  if (!invoice) return <ViewFrame {...frame} loading={loadingInvoices} notFound={!loadingInvoices} />;

  const status = invoiceStatusDisplay(invoice.status);
  const hint = vencimentoHint(invoice);
  const canMarkPaid = canEditAdministrativo && isOpenStatus(invoice.status);
  // Outras notas do mesmo empenho, da mais antiga para a mais nova
  const siblings = invoices
    .filter((i) => i.empenho_id === invoice.empenho_id)
    .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());
  const liquidadoEmpenho = siblings
    .filter((i) => i.status.toUpperCase() !== "CANCELADO")
    .reduce((acc, i) => acc + i.value, 0);

  return (
    <ViewFrame
      {...frame}
      accent={contrato?.cor}
      eyebrow={
        <>
          <CodeTag>{invoiceLabel(invoice.numero)}</CodeTag>
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
          <span className="truncate">
            {invoice.company?.name}
            {invoice.empenho && (
              <>
                {" "}
                <span className="text-text-muted">·</span> {invoice.empenho.numero}
              </>
            )}
          </span>
        </>
      }
      title={invoice.description || `Nota fiscal ${invoiceLabel(invoice.numero)}`}
      editLabel="Editar nota"
      footerActions={
        canMarkPaid && (
          <Button variant="success" icon={CheckCircle2} onClick={() => setConfirmingPaid(true)}>
            Marcar como paga
          </Button>
        )
      }
    >
      {/* Aviso só quando há algo a resolver */}
      {invoice.status.toUpperCase() === "VENCIDO" && (
        <div className="flex items-center gap-2.5 rounded-lg border border-danger-border bg-danger-bg px-3.5 py-2.5 text-sm text-danger-text">
          <AlertTriangle size={16} className="shrink-0" />
          <p>
            <span className="font-semibold">Vencida{hint ? ` (${hint.label})` : ""}.</span> O pagamento não foi
            registrado até {formatDateOnly(invoice.vencimento)}.
          </p>
        </div>
      )}

      <StatTiles>
        <StatTile
          label="Valor da nota"
          value={formatCurrency(invoice.value)}
          hint={empenho && empenho.value > 0 ? `${Math.round((invoice.value / empenho.value) * 100)}% do empenho` : undefined}
        />
        <StatTile
          label="Vencimento"
          value={formatDateOnly(invoice.vencimento)}
          hint={hint?.label ?? status.label}
          hintTone={hint?.tone ?? "muted"}
        />
        <StatTile label="Lançada em" value={formatDate(invoice.createdAt)} hint={`atualizada em ${formatDate(invoice.updatedAt)}`} />
        <StatTile
          label="Empenho a liquidar"
          value={empenho ? formatCurrency(Math.max(0, empenho.saldoALiquidar)) : "—"}
          hint={empenho ? `de ${formatCurrency(empenho.value)}` : undefined}
        />
      </StatTiles>

      <FormSection title="Dados da nota" icon={FileText}>
        <DetailGrid>
          <DetailItem icon={Hash} label="Número">
            {invoice.numero}
          </DetailItem>
          <DetailItem icon={Building2} label="Empresa">
            {invoice.company?.name ?? "—"}
          </DetailItem>
          <DetailItem icon={Hash} label="CNPJ">
            {invoice.company?.cnpj ? maskCnpj(invoice.company.cnpj) : "—"}
          </DetailItem>
          {invoice.description && (
            <DetailItem icon={AlignLeft} label="Descrição" long className="sm:col-span-2 lg:col-span-3">
              {invoice.description}
            </DetailItem>
          )}
        </DetailGrid>
      </FormSection>

      <FormSection title="Vínculos" icon={Link2}>
        <RelationGrid>
          <RelationCard
            icon={Building2}
            label="Empresa"
            title={invoice.company?.name ?? "—"}
            hint={invoice.company?.cnpj ? maskCnpj(invoice.company.cnpj) : undefined}
            onClick={linkTo("empresa", invoice.company_id)}
          />
          <RelationCard
            icon={FileSignature}
            label="Contrato"
            title={contrato?.identificador ?? invoice.empenho?.contrato?.identificador ?? "—"}
            color={contrato?.cor}
            hint={contrato ? `${formatCurrency(contrato.valor)} · vigência até ${formatDateOnly(contrato.dataFim)}` : undefined}
            onClick={linkTo("contrato", contratoId)}
          />
          <RelationCard
            icon={Layers2}
            label="Empenho"
            title={invoice.empenho?.numero ?? "—"}
            hint={
              empenho ? `${formatCurrency(empenho.value)} · a liquidar ${formatCurrency(Math.max(0, empenho.saldoALiquidar))}` : undefined
            }
            onClick={linkTo("empenho", invoice.empenho_id)}
          />
          {invoice.ordemServico ? (
            <RelationCard
              icon={ClipboardList}
              label="Ordem de serviço e obra"
              title={[invoice.ordemServico.numero, invoice.obra?.identificacaoPatrimonial].filter(Boolean).join(" · ")}
              hint={invoice.obra?.nome}
              onClick={linkTo("ordemServico", invoice.ordemServico.id)}
            />
          ) : (
            <RelationCard icon={ClipboardList} label="Ordem de serviço" title="Sem OS vinculada" hint="nota lançada direto no empenho" />
          )}
        </RelationGrid>
      </FormSection>

      <FormSection title="Notas deste empenho" icon={CalendarClock} count={siblings.length}>
        {siblings.length === 0 ? (
          <EmptyNote>Nenhuma nota neste empenho.</EmptyNote>
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
                {siblings.map((nf) => {
                  const nfStatus = invoiceStatusDisplay(nf.status);
                  const current = nf.id === invoice.id;
                  return (
                    <Tr
                      key={nf.id}
                      className={current ? "bg-surface-muted" : undefined}
                      onOpen={current ? undefined : linkTo("invoice", nf.id)}
                    >
                      <Td>
                        <span className="font-semibold text-text-primary">{invoiceLabel(nf.numero)}</span>
                        {current && <span className="text-text-muted"> · esta</span>}
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
                  <Td>Liquidado no empenho</Td>
                  <Td />
                  <Td />
                  <Td>{formatCurrency(liquidadoEmpenho)}</Td>
                </Tr>
              </TableFoot>
            </Table>
          </div>
        )}
      </FormSection>

      <MarkPaidDialog invoice={invoice} open={confirmingPaid} onClose={() => setConfirmingPaid(false)} />
    </ViewFrame>
  );
}
