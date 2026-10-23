import { Building2, FileSignature, Hash, Mail, MapPin, Phone } from "lucide-react";
import { useCompanies } from "../../store/companies";
import { useContratos } from "../../store/contratos";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { maskCep, maskCnpj, maskPhone } from "../../utils/masks";
import { contratoStatusDisplay, getDeadlineHint, HINT_TEXT } from "../../utils/status-display";
import {
  CodeTag,
  DetailGrid,
  DetailItem,
  FormSection,
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

export function EmpresaView({ id, ...frame }: ViewProps) {
  const { linkTo } = useViewerNav();
  const loading = useEnsureData("companies");
  const loadingContratos = useEnsureData("contratos");

  const empresa = useCompanies((s) => s.companies.find((c) => c.id === id));
  const allContratos = useContratos((s) => s.data?.contratos);

  if (!empresa) return <ViewFrame {...frame} loading={loading} notFound={!loading} />;

  const contratos = (allContratos ?? []).filter((c) => c.company.id === empresa.id);
  // Totais dos contratos que valem (cancelados ficam de fora)
  const validos = contratos.filter((c) => c.status !== "CANCELADO");
  const contratado = validos.reduce((acc, c) => acc + c.valor, 0);
  const empenhado = validos.reduce((acc, c) => acc + c.valorEmpenhado, 0);
  const liquidado = validos.reduce((acc, c) => acc + c.valorLiquidado, 0);
  const aLiquidar = validos.reduce((acc, c) => acc + Math.max(0, c.saldoALiquidar), 0);
  const ativos = validos.filter((c) => c.status === "ATIVO").length;

  return (
    <ViewFrame
      {...frame}
      eyebrow={
        <>
          <CodeTag>{maskCnpj(empresa.cnpj)}</CodeTag>
          <StatusPill tone={ativos > 0 ? "info" : "neutral"}>
            {ativos > 0 ? `${ativos} ${ativos === 1 ? "contrato ativo" : "contratos ativos"}` : "Sem contrato ativo"}
          </StatusPill>
          <span className="truncate">
            {empresa.city}/{empresa.state}
          </span>
        </>
      }
      title={empresa.name}
      editLabel="Editar empresa"
    >
      <StatTiles>
        <StatTile label="Contratado" value={formatCurrency(contratado)} hint={`${validos.length} ${validos.length === 1 ? "contrato" : "contratos"}`} />
        <StatTile label="Empenhado" value={formatCurrency(empenhado)} hint={`${pct(empenhado, contratado)}% do contratado`} />
        <StatTile label="Liquidado" value={formatCurrency(liquidado)} hint={`${pct(liquidado, contratado)}% do contratado`} />
        <StatTile label="A liquidar" value={formatCurrency(aLiquidar)} hint="nos contratos" />
      </StatTiles>

      <FormSection title="Dados cadastrais" icon={Building2}>
        <DetailGrid>
          <DetailItem icon={Hash} label="CNPJ">
            {maskCnpj(empresa.cnpj)}
          </DetailItem>
          <DetailItem icon={Phone} label="Telefone">
            {empresa.phone ? maskPhone(empresa.phone) : "—"}
          </DetailItem>
          <DetailItem icon={Mail} label="E-mail">
            {empresa.email || "—"}
          </DetailItem>
          <DetailItem icon={MapPin} label="Endereço" className="sm:col-span-2">
            {empresa.address}
            <span className="block text-xs font-normal text-text-muted">
              {empresa.city}/{empresa.state} · CEP {maskCep(empresa.cep)}
            </span>
          </DetailItem>
        </DetailGrid>
      </FormSection>

      <FormSection title="Contratos" icon={FileSignature} count={contratos.length}>
        {loadingContratos ? (
          <EmptyNote>Carregando contratos...</EmptyNote>
        ) : contratos.length === 0 ? (
          <EmptyNote>Nenhum contrato com esta empresa.</EmptyNote>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table compact>
              <TableHead>
                <Th>Contrato</Th>
                <Th>Status</Th>
                <Th>Vigência</Th>
                <Th>A liquidar</Th>
              </TableHead>
              <TableBody>
                {contratos.map((c) => {
                  const st = contratoStatusDisplay(c.status, String(c.dataFim));
                  const hint = getDeadlineHint(String(c.dataFim), { active: c.status === "ATIVO", dueSoonDays: 60 });
                  return (
                    <Tr key={c.id} onOpen={linkTo("contrato", c.id)} muted={c.status === "CANCELADO"}>
                      <Td>
                        <span className="flex items-center gap-1.5 font-semibold text-text-primary">
                          <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                          {c.identificador}
                        </span>
                        <span className="block text-[11px] text-text-muted line-clamp-1">{c.descricaoCurta}</span>
                      </Td>
                      <Td>
                        <StatusPill tone={st.tone} size="sm">
                          {st.label}
                        </StatusPill>
                      </Td>
                      <Td>
                        {formatDateOnly(c.dataFim)}
                        {hint && hint.tone !== "muted" && <span className={`block text-[11px] ${HINT_TEXT[hint.tone]}`}>{hint.label}</span>}
                      </Td>
                      <Td>{formatCurrency(Math.max(0, c.saldoALiquidar))}</Td>
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
