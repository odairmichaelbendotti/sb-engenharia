import { FileSignature } from "lucide-react";
import type { ObraDetail, ObraDetailFinancial } from "../../../types/obra";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { Badge, Table, TableBody, TableHead, Td, Th, Tr, TableFoot } from "../../components/ui";
import { cx } from "../../utils/cx";
import { PanelModal, ProgressBar, StatusPill } from "./obra-detail-shared";
import { formatPercent, percentOf, RECORD_STATUS } from "./obra-detail-utils";

interface ContratoEmpenhosModalProps {
  contrato: ObraDetail["contrato"];
  financial: ObraDetailFinancial["contrato"];
  // Empenhos que financiam a OS desta obra (destacados na tabela)
  currentEmpenhoIds: string[];
  onClose: () => void;
}

function Summary({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted/60 px-3 py-2.5 min-w-0">
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className={`text-sm font-semibold truncate ${tone ?? "text-text-primary"}`}>{value}</p>
      {hint && <p className="text-[11px] text-text-secondary mt-0.5">{hint}</p>}
    </div>
  );
}

export function ContratoEmpenhosModal({ contrato, financial, currentEmpenhoIds, onClose }: ContratoEmpenhosModalProps) {
  const empenhadoPercent = percentOf(financial.totalEmpenhado, financial.valor);
  const utilizadoPercent = percentOf(financial.totalLiquidado, financial.valor);
  const saldoAEmpenhar = financial.valor - financial.totalEmpenhado;

  return (
    <PanelModal
      icon={FileSignature}
      title={`Empenhos do contrato ${contrato.identificador}`}
      subtitle={
        <>
          {contrato.company.name} · vigência {formatDateOnly(contrato.dataInicio)} a {formatDateOnly(contrato.dataFim)}
        </>
      }
      onClose={onClose}
      size="xl"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Summary label="Valor do contrato" value={formatCurrency(financial.valor)} />
        <Summary
          label="Empenhado"
          value={formatCurrency(financial.totalEmpenhado)}
          hint={`${formatPercent(empenhadoPercent)} do contrato`}
        />
        <Summary
          label="Utilizado (NFs)"
          value={formatCurrency(financial.totalLiquidado)}
          hint={`${formatPercent(utilizadoPercent)} do contrato`}
          tone="text-success-text"
        />
        <Summary
          label="Saldo a empenhar"
          value={formatCurrency(saldoAEmpenhar)}
          tone={saldoAEmpenhar < 0 ? "text-danger-text" : "text-text-primary"}
        />
      </div>

      <Table compact>
        <TableHead>
          <Th>Empenho</Th>
          <Th>Vigência</Th>
          <Th>Valor</Th>
          <Th>Liquidado</Th>
          <Th className="hidden md:table-cell">% liquidado</Th>
          <Th className="hidden sm:table-cell">OS</Th>
          <Th>Situação</Th>
        </TableHead>
        <TableBody>
          {financial.empenhos.map((empenho) => {
            const isCurrent = currentEmpenhoIds.includes(empenho.id);
            const liquidadoPercent = percentOf(empenho.liquidado, empenho.value);
            return (
              <Tr
                key={empenho.id}
                className={cx(isCurrent && "bg-surface-muted/60", empenho.status === "CANCELADO" && "opacity-60")}
              >
                <Td>
                  <p className="font-semibold text-text-primary flex items-center gap-1.5">
                    {empenho.numero}
                    {isCurrent && <Badge>desta obra</Badge>}
                  </p>
                  <p className="text-[11px] text-text-muted line-clamp-2" title={empenho.description}>
                    {empenho.description}
                  </p>
                </Td>
                <Td>
                  <span className="text-xs text-text-secondary">
                    {formatDateOnly(empenho.startAt)} → {formatDateOnly(empenho.endAt)}
                  </span>
                </Td>
                <Td>
                  <span className="font-medium text-text-primary">{formatCurrency(empenho.value)}</span>
                </Td>
                <Td>
                  <span className="text-success-text">{formatCurrency(empenho.liquidado)}</span>
                </Td>
                <Td className="hidden md:table-cell">
                  {/* A barra não tem largura própria: o bloco fixa a largura dela dentro da célula */}
                  <div className="w-24">
                    <ProgressBar percent={liquidadoPercent} colorClassName="bg-progress" />
                    <p className="text-[10px] text-text-muted mt-0.5">{formatPercent(liquidadoPercent)}</p>
                  </div>
                </Td>
                <Td className="hidden sm:table-cell">
                  <span className="text-text-secondary">{empenho.ordensServicoCount}</span>
                </Td>
                <Td>
                  <StatusPill status={empenho.status} map={RECORD_STATUS} />
                </Td>
              </Tr>
            );
          })}
        </TableBody>
        {/* Rodapé sem colSpan (o Td não aceita): cada total fica sob a sua coluna */}
        <TableFoot>
          <Tr className="font-semibold text-text-primary">
            <Td>
              Total empenhado
              <span className="block text-[10.5px] font-normal text-text-muted">sem empenhos cancelados</span>
            </Td>
            <Td />
            <Td>{formatCurrency(financial.totalEmpenhado)}</Td>
            <Td>
              <span className="text-success-text">{formatCurrency(financial.totalLiquidado)}</span>
            </Td>
            <Td className="hidden md:table-cell">
              <span className="text-xs font-medium text-text-secondary">
                {formatPercent(percentOf(financial.totalLiquidado, financial.totalEmpenhado))} do empenhado
              </span>
            </Td>
            <Td className="hidden sm:table-cell" />
            <Td />
          </Tr>
        </TableFoot>
      </Table>
    </PanelModal>
  );
}
