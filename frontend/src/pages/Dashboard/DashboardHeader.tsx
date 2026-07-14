type DashboardHeaderProps = {
  periodoSelecionado: string;
  onPeriodoChange: (periodo: string) => void;
};

export default function DashboardHeader({
  periodoSelecionado,
  onPeriodoChange,
}: DashboardHeaderProps) {
  return (
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
            onClick={() => onPeriodoChange(periodo)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              periodoSelecionado === periodo
                ? "bg-primary-500 text-white"
                : "text-text-secondary hover:bg-surface-muted"
            }`}
          >
            {periodo === "semana" ? "Semana" : periodo === "mes" ? "Mês" : "Ano"}
          </button>
        ))}
      </div>
    </div>
  );
}
