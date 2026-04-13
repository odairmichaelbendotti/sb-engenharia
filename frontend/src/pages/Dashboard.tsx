import { useState, useMemo, useEffect } from "react";
import {
  DollarSign,
  Building2,
  FileText,
  Layers2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import Breadcrumb from "../components/Breadcrumb";
import { useUser } from "../store/user";
import { useNavigate } from "react-router";

// Mock data
const mockData = {
  empresas: [
    {
      id: 1,
      nome: "Construtora Silva Ltda",
      cnpj: "12.345.678/0001-90",
      empenhosAtivos: 2,
      valorTotal: 225000,
    },
    {
      id: 2,
      nome: "Engenharia Santos S.A.",
      cnpj: "98.765.432/0001-10",
      empenhosAtivos: 1,
      valorTotal: 230000,
    },
    {
      id: 3,
      nome: "Obras Rápidas ME",
      cnpj: "45.678.901/0001-23",
      empenhosAtivos: 2,
      valorTotal: 156000,
    },
    {
      id: 4,
      nome: "Fundação Forte EPP",
      cnpj: "67.890.123/0001-45",
      empenhosAtivos: 0,
      valorTotal: 0,
    },
    {
      id: 5,
      nome: "Estrutura Primavera",
      cnpj: "89.012.345/0001-67",
      empenhosAtivos: 1,
      valorTotal: 175000,
    },
  ],
  empenhos: [
    {
      id: 1,
      numero: "EMP-2024-001",
      empresa: "Construtora Silva Ltda",
      valor: 150000,
      dataLimite: "2024-12-31",
      status: "ativo",
      progresso: 65,
    },
    {
      id: 2,
      numero: "EMP-2024-002",
      empresa: "Engenharia Santos S.A.",
      valor: 230000,
      dataLimite: "2024-11-30",
      status: "ativo",
      progresso: 40,
    },
    {
      id: 6,
      numero: "EMP-2024-006",
      empresa: "Estrutura Primavera",
      valor: 175000,
      dataLimite: "2025-03-31",
      status: "ativo",
      progresso: 25,
    },
  ],
  notasFiscais: [
    {
      id: 1,
      number: "NF-2024-001",
      client: "Construtora Silva Ltda",
      value: 15250,
      status: "paid",
      date: "2024-01-15",
    },
    {
      id: 2,
      number: "NF-2024-002",
      client: "Engenharia Santos S.A.",
      value: 8900,
      status: "pending",
      date: "2024-01-18",
    },
    {
      id: 3,
      number: "NF-2024-003",
      client: "Obras Rápidas ME",
      value: 22500,
      status: "overdue",
      date: "2024-01-20",
    },
    {
      id: 4,
      number: "NF-2024-004",
      client: "Fundação Forte EPP",
      value: 5600,
      status: "paid",
      date: "2024-01-22",
    },
  ],
  atividades: [
    {
      id: 1,
      tipo: "empenho",
      descricao: "Novo empenho criado",
      detalhes: "EMP-2024-009 - Construtora Silva Ltda",
      data: "2024-08-22T10:30:00",
      usuario: "João Admin",
    },
    {
      id: 2,
      tipo: "nf",
      descricao: "Nota fiscal paga",
      detalhes: "NF-2024-001 - R$ 15.250,00",
      data: "2024-08-22T09:15:00",
      usuario: "Maria Financeiro",
    },
    {
      id: 3,
      tipo: "empresa",
      descricao: "Empresa atualizada",
      detalhes: "Engenharia Santos S.A.",
      data: "2024-08-21T16:45:00",
      usuario: "João Admin",
    },
    {
      id: 4,
      tipo: "empenho",
      descricao: "Empenho concluído",
      detalhes: "EMP-2024-007 - Manutenção preventiva",
      data: "2024-08-21T14:20:00",
      usuario: "Pedro Engenheiro",
    },
    {
      id: 5,
      tipo: "nf",
      descricao: "Nota fiscal emitida",
      detalhes: "NF-2024-005 - Estrutura Primavera",
      data: "2024-08-20T11:00:00",
      usuario: "Maria Financeiro",
    },
    {
      id: 6,
      tipo: "empenho",
      descricao: "Empenho cancelado",
      detalhes: "EMP-2024-005 - Fundação Forte",
      data: "2024-08-19T15:30:00",
      usuario: "João Admin",
    },
  ],
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("pt-BR");
};

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Dashboard() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState("mes");
  const navigate = useNavigate();

  const { user } = useUser();

  useEffect(() => {
    if (!user) {
      navigate("/signin");
    }
  }, [user, navigate]);

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

  // Status configs
  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { bg: string; text: string; border: string; label: string }
    > = {
      paid: {
        bg: "bg-success-bg",
        text: "text-success-text",
        border: "border-success-border",
        label: "Pago",
      },
      pending: {
        bg: "bg-warning-bg",
        text: "text-warning-text",
        border: "border-warning-border",
        label: "Pendente",
      },
      overdue: {
        bg: "bg-danger-bg",
        text: "text-danger-text",
        border: "border-danger-border",
        label: "Vencido",
      },
      ativo: {
        bg: "bg-success-bg",
        text: "text-success-text",
        border: "border-success-border",
        label: "Ativo",
      },
      concluido: {
        bg: "bg-accent-100",
        text: "text-accent-600",
        border: "border-accent-200",
        label: "Concluído",
      },
      cancelado: {
        bg: "bg-danger-bg",
        text: "text-danger-text",
        border: "border-danger-border",
        label: "Cancelado",
      },
    };
    return configs[status] || configs.pendente;
  };

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case "empenho":
        return <Layers2 size={16} className="text-primary-500" />;
      case "nf":
        return <FileText size={16} className="text-accent-500" />;
      case "empresa":
        return <Building2 size={16} className="text-success-text" />;
      default:
        return <MoreHorizontal size={16} />;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb current="Dashboard" />

      {/* Header com seletor de período */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">
            Visão geral do sistema e estatísticas em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg p-1">
          {["semana", "mes", "ano"].map((periodo) => (
            <button
              key={periodo}
              onClick={() => setPeriodoSelecionado(periodo)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                periodoSelecionado === periodo
                  ? "bg-primary-500 text-white"
                  : "text-text-secondary hover:bg-surface-muted"
              }`}
            >
              {periodo === "semana"
                ? "Semana"
                : periodo === "mes"
                  ? "Mês"
                  : "Ano"}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Empresas Cadastradas"
          value={metrics.totalEmpresas.toString()}
          subtitle="Cadastros ativos"
          change="+2 este mês"
          changeType="positive"
          icon={<Building2 size={24} className="text-primary-500" />}
          color="bg-primary-100"
        />
        <StatCard
          title="Empenhos Ativos"
          value={metrics.totalEmpenhos.toString()}
          subtitle="Em andamento"
          change="3 concluídos"
          changeType="neutral"
          icon={<Layers2 size={24} className="text-success-text" />}
          color="bg-success-bg"
        />
        <StatCard
          title="Valor em Empenhos"
          value={formatCurrency(metrics.valorEmpenhosAtivos)}
          subtitle="Total empenhado"
          change="+12% vs mês anterior"
          changeType="positive"
          icon={<DollarSign size={24} className="text-accent-500" />}
          color="bg-accent-100"
        />
        <StatCard
          title="Notas Fiscais"
          value={metrics.totalNF.toString()}
          subtitle="Emitidas"
          change="2 pendentes"
          changeType="negative"
          icon={<FileText size={24} className="text-warning-text" />}
          color="bg-warning-bg"
        />
      </div>

      {/* Grid principal com tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabela de Empenhos Ativos */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                  <Layers2 size={18} className="text-primary-500" />
                  Empenhos Ativos
                </h3>
                <p className="text-text-secondary text-sm">
                  Acompanhamento de progresso
                </p>
              </div>
              <button className="text-primary-500 text-sm font-medium hover:underline flex items-center gap-1">
                Ver todos <ChevronRight size={16} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                      Número
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                      Empresa
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                      Valor
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                      Progresso
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                      Prazo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockData.empenhos.map((empenho) => (
                    <tr
                      key={empenho.id}
                      className="hover:bg-surface-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Layers2 size={18} className="text-primary-500" />
                          </div>
                          <span className="font-medium text-text-primary text-sm">
                            {empenho.numero}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-text-primary">
                        {empenho.empresa}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-text-primary text-sm">
                          {formatCurrency(empenho.valor)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-surface-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${empenho.progresso}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-secondary w-8">
                            {empenho.progresso}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-text-secondary">
                          <Calendar size={14} />
                          {formatDate(empenho.dataLimite)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela de Últimas Notas Fiscais */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                  <FileText size={18} className="text-accent-500" />
                  Últimas Notas Fiscais
                </h3>
                <p className="text-text-secondary text-sm">
                  Movimentação financeira recente
                </p>
              </div>
              <button className="text-primary-500 text-sm font-medium hover:underline flex items-center gap-1">
                Ver todas <ChevronRight size={16} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                      NF
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                      Cliente
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                      Valor
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ...mockData.notasFiscais,
                    {
                      id: 5,
                      number: "NF-2024-005",
                      client: "Estrutura Primavera",
                      value: 12300,
                      status: "paid",
                      date: "2024-01-25",
                    },
                  ]
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .slice(0, 5)
                    .map((nf) => {
                      const status = getStatusConfig(nf.status);
                      return (
                        <tr
                          key={nf.id}
                          className="hover:bg-surface-muted/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                                <FileText
                                  size={18}
                                  className="text-accent-500"
                                />
                              </div>
                              <span className="font-medium text-text-primary text-sm">
                                {nf.number}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-text-primary">
                            {nf.client}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-text-primary text-sm">
                              {formatCurrency(nf.value)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}
                            >
                              {nf.status === "paid" ? (
                                <CheckCircle2 size={12} />
                              ) : nf.status === "pending" ? (
                                <Clock size={12} />
                              ) : (
                                <AlertCircle size={12} />
                              )}
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-sm text-text-secondary">
                              <Calendar size={14} />
                              {formatDate(nf.date)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Coluna lateral - 1/3 */}
        <div className="space-y-6">
          {/* Atividades Recentes */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Clock size={18} className="text-accent-500" />
                Atividades Recentes
              </h3>
            </div>
            <div className="p-4 space-y-4 max-h-100 overflow-y-auto">
              {mockData.atividades.map((atividade) => (
                <div key={atividade.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-surface-muted rounded-lg flex items-center justify-center shrink-0">
                    {getActivityIcon(atividade.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {atividade.descricao}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {atividade.detalhes}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                      <span>{formatDateTime(atividade.data)}</span>
                      <span>•</span>
                      <span>{atividade.usuario}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas Fiscais Recentes */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <FileText size={18} className="text-warning-text" />
                NFs Pendentes
              </h3>
            </div>
            <div className="divide-y divide-border">
              {mockData.notasFiscais
                .filter((nf) => nf.status !== "paid")
                .map((nf) => {
                  const status = getStatusConfig(nf.status);
                  return (
                    <div
                      key={nf.id}
                      className="p-4 hover:bg-surface-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-text-primary text-sm">
                          {nf.number}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">{nf.client}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-text-primary">
                          {formatCurrency(nf.value)}
                        </span>
                        <span className="text-xs text-text-muted">
                          {formatDate(nf.date)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="p-3 border-t border-border bg-surface-muted">
              <button className="w-full text-center text-sm text-primary-500 font-medium hover:underline">
                Ver todas as notas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
