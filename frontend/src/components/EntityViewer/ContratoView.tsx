import type { ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  FileSignature,
  FileText,
  Hash,
  Layers2,
  Link2,
  MapPin,
  Percent,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useContratos } from "../../store/contratos";
import { useEmpenhos } from "../../store/empenhos";
import { useOrdensServico } from "../../store/ordensServico";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { contratoStatusDisplay, empenhoStatusDisplay, getDeadlineHint } from "../../utils/status-display";
import { PLACEHOLDER_A_PREENCHER } from "../../../types/contrato";
import { ordemServicoStatusDisplay } from "../../pages/OrdemServico/ordem-servico-display";
import { getOrdemServicoBalance } from "../../pages/OrdemServico/ordem-servico-balance";
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
  TableHead,
  Td,
  Th,
  Tr,
} from "../ui";
import { EmptyNote, ViewFrame, type ViewProps } from "./ViewFrame";
import { useViewerNav } from "./useViewerNav";
import { useEnsureData } from "./useEnsureData";

const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

// Campo do documento da OS: contratos antigos ficam com "A PREENCHER" até serem editados
function DocValue({ value, children }: { value: string | null | undefined; children?: ReactNode }) {
  if (!value || value === PLACEHOLDER_A_PREENCHER) return <span className="font-normal text-warning-text">A preencher</span>;
  return <>{children ?? value}</>;
}

export function ContratoView({ id, ...frame }: ViewProps) {
  const { linkTo } = useViewerNav();
  const loading = useEnsureData("contratos");
  useEnsureData("empenhos");
  useEnsureData("ordensServico");

  const contrato = useContratos((s) => s.data?.contratos.find((c) => c.id === id));
  const allEmpenhos = useEmpenhos((s) => s.data?.empenhos);
  const allOrdens = useOrdensServico((s) => s.data?.ordensServico);

  if (!contrato) return <ViewFrame {...frame} loading={loading} notFound={!loading} />;

  const status = contratoStatusDisplay(contrato.status, String(contrato.dataFim));
  const vigencia = getDeadlineHint(String(contrato.dataFim), { active: contrato.status === "ATIVO", dueSoonDays: 60 });
  const empenhos = (allEmpenhos ?? []).filter((e) => e.contrato_id === contrato.id);
  const ordens = (allOrdens ?? []).filter((os) => os.empenho.contrato.id === contrato.id);
  const fiscais = [...contrato.fiscais].sort((a, b) => a.tipo.localeCompare(b.tipo));

  return (
    <ViewFrame
      {...frame}
      accent={contrato.cor}
      eyebrow={
        <>
          <CodeTag>{contrato.identificador}</CodeTag>
          <StatusPill tone={status.tone} title={status.title}>
            {status.label}
          </StatusPill>
          <span className="truncate">{contrato.company.name}</span>
        </>
      }
      title={contrato.descricaoCurta}
      editLabel="Editar contrato"
    >
      <StatTiles>
        <StatTile
          label="Valor do contrato"
          value={formatCurrency(contrato.valor)}
          hint={`${formatCurrency(Math.max(0, contrato.saldoDisponivel))} a empenhar`}
        />
        <StatTile
          label="Empenhado"
          value={formatCurrency(contrato.valorEmpenhado)}
          hint={`${pct(contrato.valorEmpenhado, contrato.valor)}% · ${empenhos.length} ${empenhos.length === 1 ? "empenho" : "empenhos"}`}
        />
        <StatTile
          label="Liquidado"
          value={formatCurrency(contrato.valorLiquidado)}
          hint={`${pct(contrato.valorLiquidado, contrato.valor)}% · a liquidar ${formatCurrency(Math.max(0, contrato.saldoALiquidar))}`}
        />
        <StatTile
          label="Vigência até"
          value={formatDateOnly(contrato.dataFim)}
          hint={vigencia?.label ?? `desde ${formatDateOnly(contrato.dataInicio)}`}
          hintTone={vigencia?.tone ?? "muted"}
        />
      </StatTiles>

      <FormSection title="Dados do contrato" icon={FileSignature}>
        <DetailGrid>
          <DetailItem icon={CalendarDays} label="Período">
            {formatDateOnly(contrato.dataInicio)} a {formatDateOnly(contrato.dataFim)}
          </DetailItem>
          <DetailItem icon={Hash} label="e-PAG">
            <DocValue value={contrato.ePag} />
          </DetailItem>
          <DetailItem icon={Percent} label="BDI">
            {contrato.bdi ? `${String(contrato.bdi).replace(".", ",")}%` : <DocValue value={null} />}
          </DetailItem>
          <DetailItem icon={FileText} label="ETP">
            <DocValue value={contrato.etp} />
          </DetailItem>
          <DetailItem icon={FileText} label="Termo de referência">
            <DocValue value={contrato.termoReferencia} />
          </DetailItem>
          <DetailItem icon={CalendarDays} label="Data-base SINAPI">
            <DocValue value={contrato.dataBaseSinapi} />
          </DetailItem>
          <DetailItem icon={MapPin} label="Endereço" className="sm:col-span-2 lg:col-span-3">
            <DocValue value={contrato.endereco} />
          </DetailItem>
        </DetailGrid>
      </FormSection>

      {(contrato.lotes.length > 0 || fiscais.length > 0) && (
        <FormSection title="Lotes e fiscais" icon={ShieldCheck}>
          <DetailGrid>
            {[...contrato.lotes]
              .sort((a, b) => a.numero - b.numero)
              .map((lote) => (
                <DetailItem key={lote.id} icon={Tag} label={`Lote ${String(lote.numero).padStart(2, "0")}`}>
                  {lote.nome}
                  <span className="block text-xs font-normal text-text-muted">
                    desconto de {String(lote.desconto).replace(".", ",")}%
                  </span>
                </DetailItem>
              ))}
            {fiscais.map((fiscal) => (
              <DetailItem
                key={fiscal.id}
                icon={ShieldCheck}
                label={fiscal.tipo === "TECNICO" ? "Fiscal técnico" : "Fiscal administrativo"}
              >
                {fiscal.nome}
                <span className="block text-xs font-normal text-text-muted">
                  {[fiscal.ramal && `ramal ${fiscal.ramal}`, fiscal.email].filter(Boolean).join(" · ")}
                </span>
              </DetailItem>
            ))}
          </DetailGrid>
        </FormSection>
      )}

      <FormSection title="Vínculos" icon={Link2}>
        <RelationGrid>
          <RelationCard
            icon={Building2}
            label="Empresa"
            title={contrato.company.name}
            onClick={linkTo("empresa", contrato.company.id)}
          />
        </RelationGrid>
      </FormSection>

      <FormSection title="Empenhos do contrato" icon={Layers2} count={empenhos.length}>
        {empenhos.length === 0 ? (
          <EmptyNote>Nenhum empenho neste contrato.</EmptyNote>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table compact>
              <TableHead>
                <Th>Empenho</Th>
                <Th>Status</Th>
                <Th>Valor</Th>
                <Th>A liquidar</Th>
              </TableHead>
              <TableBody>
                {empenhos.map((e) => {
                  const st = empenhoStatusDisplay(e.status, String(e.endAt));
                  return (
                    <Tr key={e.id} onOpen={linkTo("empenho", e.id)} muted={e.status.toUpperCase() === "CANCELADO"}>
                      <Td>
                        <span className="font-semibold text-text-primary">{e.numero}</span>
                        <span className="block text-[11px] text-text-muted line-clamp-1">{e.description}</span>
                      </Td>
                      <Td>
                        <StatusPill tone={st.tone} size="sm">
                          {st.label}
                        </StatusPill>
                      </Td>
                      <Td>{formatCurrency(e.value)}</Td>
                      <Td>{formatCurrency(Math.max(0, e.saldoALiquidar))}</Td>
                    </Tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </FormSection>

      <FormSection title="Ordens de serviço do contrato" icon={ClipboardList} count={ordens.length}>
        {ordens.length === 0 ? (
          <EmptyNote>Nenhuma ordem de serviço emitida neste contrato.</EmptyNote>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table compact>
              <TableHead>
                <Th>Ordem de serviço</Th>
                <Th>Status</Th>
                <Th>Valor</Th>
                <Th>A liquidar</Th>
              </TableHead>
              <TableBody>
                {ordens.map((os) => {
                  const st = ordemServicoStatusDisplay(os);
                  return (
                    <Tr key={os.id} onOpen={linkTo("ordemServico", os.id)} muted={os.status === "CANCELADO"}>
                      <Td>
                        <span className="block font-semibold text-text-primary line-clamp-1">
                          {os.obra?.nome ?? os.empenho.description}
                        </span>
                        <CodeTag className="mt-0.5">{os.numero}</CodeTag>
                      </Td>
                      <Td>
                        <StatusPill tone={st.tone} size="sm">
                          {st.label}
                        </StatusPill>
                      </Td>
                      {/* OS planejada: o valor planejado, sem saldo a liquidar (fica fora do emitido) */}
                      <Td>
                        {os.aguardandoEmissao && os.status === "ATIVO"
                          ? `${formatCurrency(os.valorPlanejado ?? 0)} planejado`
                          : formatCurrency(os.valor)}
                      </Td>
                      <Td>
                        {os.status === "ATIVO" && !os.aguardandoEmissao
                          ? formatCurrency(getOrdemServicoBalance(os).saldo)
                          : "—"}
                      </Td>
                    </Tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </FormSection>
    </ViewFrame>
  );
}
