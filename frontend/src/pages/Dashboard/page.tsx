import { useState, useMemo } from "react";
import { mockData } from "./mockData";
import DashboardHeader from "./DashboardHeader";
import DashboardStats from "./DashboardStats";
import ActiveEmpenhosTable from "./ActiveEmpenhosTable";
import RecentInvoicesTable from "./RecentInvoicesTable";
import RecentActivities from "./RecentActivities";
import PendingInvoices from "./PendingInvoices";

export default function Dashboard() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState("mes");

  // Métricas calculadas
  const metrics = useMemo(() => {
    const totalEmpresas = mockData.empresas.length;
    const totalEmpenhos = mockData.empenhos.length + 5; // +5 concluídos/cancelados
    const totalNF = mockData.notasFiscais.length + 1;
    const valorEmpenhosAtivos = mockData.empenhos.reduce(
      (sum, e) => sum + e.valor,
      0,
    );
    const valorTotalEmpenhos = valorEmpenhosAtivos + 120000 + 45000 + 75000; // inclui concluídos
    const valorNFPago = mockData.notasFiscais
      .filter((nf) => nf.status === "paid")
      .reduce((sum, nf) => sum + nf.value, 0);
    const valorNFPendente = mockData.notasFiscais
      .filter((nf) => nf.status === "pending" || nf.status === "overdue")
      .reduce((sum, nf) => sum + nf.value, 0);

    return {
      totalEmpresas,
      totalEmpenhos,
      totalNF,
      valorEmpenhosAtivos,
      valorTotalEmpenhos,
      valorNFPago,
      valorNFPendente,
      empenhosConcluidos: 2,
      empenhosCancelados: 1,
    };
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <DashboardHeader
        periodoSelecionado={periodoSelecionado}
        onPeriodoChange={setPeriodoSelecionado}
      />

      <DashboardStats
        totalEmpresas={metrics.totalEmpresas}
        totalEmpenhos={metrics.totalEmpenhos}
        valorEmpenhosAtivos={metrics.valorEmpenhosAtivos}
        totalNF={metrics.totalNF}
      />

      {/* Grid principal com tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <ActiveEmpenhosTable empenhos={mockData.empenhos} />
          <RecentInvoicesTable notasFiscais={mockData.notasFiscais} />
        </div>

        {/* Coluna lateral - 1/3 */}
        <div className="space-y-6">
          <RecentActivities atividades={mockData.atividades} />
          <PendingInvoices notasFiscais={mockData.notasFiscais} />
        </div>
      </div>
    </div>
  );
}
