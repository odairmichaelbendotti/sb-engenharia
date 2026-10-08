import { SummaryStrip, type SummaryCell } from "../../components/SummaryStrip";
import { formatCurrency } from "../../utils/format-currency";

type DashboardStatsProps = {
  canViewAdministrativo: boolean;
  canViewEngenharia: boolean;
  engenhariaFirst: boolean;
  empresasComContratoAtivo: number;
  notasPendentesVencidas: { count: number; value: number };
  saldoEmpenhosAtivo: number;
  orcamentoObras: number;
  valorExecutadoObras: number;
};

// Mesma faixa de totais das listagens, como card próprio no topo do Dashboard
export default function DashboardStats({
  canViewAdministrativo,
  canViewEngenharia,
  engenhariaFirst,
  empresasComContratoAtivo,
  notasPendentesVencidas,
  saldoEmpenhosAtivo,
  orcamentoObras,
  valorExecutadoObras,
}: DashboardStatsProps) {
  if (!canViewAdministrativo && !canViewEngenharia) return null;

  const percent = orcamentoObras > 0 ? Math.round((valorExecutadoObras / orcamentoObras) * 100) : 0;
  const engenharia: SummaryCell[] = canViewEngenharia
    ? [
        {
          key: "obras",
          label: "Liquidado em obras",
          value: formatCurrency(valorExecutadoObras),
          hint: `${percent}% de ${formatCurrency(orcamentoObras)} emitidos em OS`,
        },
      ]
    : [];

  const administrativo: SummaryCell[] = canViewAdministrativo
    ? [
        {
          key: "empresas",
          label: "Empresas com contrato ativo",
          value: String(empresasComContratoAtivo),
          hint: "vinculadas a contratos ativos",
        },
        {
          key: "notas",
          label: "Notas pendentes/vencidas",
          value: formatCurrency(notasPendentesVencidas.value),
          hint: `${notasPendentesVencidas.count} ${notasPendentesVencidas.count === 1 ? "nota" : "notas"}`,
          tone: notasPendentesVencidas.count > 0 ? "warning" : "default",
        },
        {
          key: "saldo",
          label: "Saldo de empenhos ativos",
          value: formatCurrency(saldoEmpenhosAtivo),
          hint: "disponível para empenhar",
          tone: "primary",
        },
      ]
    : [];

  const cells = engenhariaFirst ? [...engenharia, ...administrativo] : [...administrativo, ...engenharia];

  return <SummaryStrip standalone cells={cells} />;
}
