import { Clock, Layers2, FileText, Building2, MoreHorizontal } from "lucide-react";
import { formatDateTime } from "../../utils/format-currency";
import type { MockAtividade } from "./mockData";

type RecentActivitiesProps = {
  atividades: MockAtividade[];
};

function getActivityIcon(tipo: string) {
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
}

export default function RecentActivities({
  atividades,
}: RecentActivitiesProps) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Clock size={18} className="text-accent-500" />
          Atividades Recentes
        </h3>
      </div>
      <div className="p-4 space-y-4 max-h-100 overflow-y-auto">
        {atividades.map((atividade) => (
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
  );
}
