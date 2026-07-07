import {
  HardHat,
  MapPin,
  Trash2,
  FileText,
  CheckCircle2,
  Activity,
  PauseCircle,
  XCircle,
  CalendarClock,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useState } from "react";
import type { Obra } from "../../../types/obra";
import type { User } from "../../../types/user";
import { formatCurrency } from "../../utils/format-currency";

interface ObraTableProps {
  obras: Obra[];
  formatCurrency: (v: number) => string;
  onEdit: (obra: Obra) => void;
  onDelete: (obra: Obra) => void;
  user: User | null;
}

const STATUS_MAP = {
  EM_ANDAMENTO: { label: "Andamento", icon: Activity, bg: "bg-warning-bg", text: "text-warning-text", border: "border-warning-border" },
  CONCLUIDA: { label: "Concluída", icon: CheckCircle2, bg: "bg-success-bg", text: "text-success-text", border: "border-success-border" },
  PARALISADA: { label: "Paralisada", icon: PauseCircle, bg: "bg-danger-bg", text: "text-danger-text", border: "border-danger-border" },
  CANCELADA: { label: "Cancelada", icon: XCircle, bg: "bg-surface-muted", text: "text-text-muted", border: "border-border" },
};

const TIPO_MAP: Record<string, string> = {
  CONSTRUCAO: "Construção",
  REFORMA: "Reforma",
  AMPLIACAO: "Ampliação",
  PAVIMENTACAO: "Pavimentação",
  SANEAMENTO: "Saneamento",
  OUTRO: "Outro",
};

type SortKey = "nome" | "dataPrevisaoTermino" | "orcamento" | "valorExecutado";
type SortDir = "asc" | "desc";

function StatusBadge({ status }: { status: Obra["status"] }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.CANCELADA;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border} whitespace-nowrap`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function ProgressCell({ orcamento, executado, formatCurrency }: { orcamento: number; executado: number; formatCurrency: (v: number) => string }) {
  const [hover, setHover] = useState(false);
  const pct = orcamento > 0 ? Math.min(100, Math.round((executado / orcamento) * 100)) : 0;

  return (
    <div
      className="relative w-full min-w-[100px]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${pct >= 90 ? "bg-danger-text" : pct >= 60 ? "bg-warning-text" : "bg-primary-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-text-muted w-8 text-right shrink-0">{pct}%</span>
      </div>
      {hover && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-text-primary text-text-inverse text-xs rounded-lg whitespace-nowrap z-10 shadow-xl">
          <p className="font-medium">{pct}% executado</p>
          <p className="text-text-inverse/70">{formatCurrency(executado)} / {formatCurrency(orcamento)}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-text-primary" />
        </div>
      )}
    </div>
  );
}

function DeadlineCell({ date, status }: { date: Date | string; status: Obra["status"] }) {
  const d = date instanceof Date ? date : new Date(date);
  const today = new Date();
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isOver = diffDays < 0 && status === "EM_ANDAMENTO";
  const isClose = diffDays >= 0 && diffDays <= 30 && status === "EM_ANDAMENTO";

  return (
    <div>
      <span className={`text-sm ${isOver ? "text-danger-text font-medium" : isClose ? "text-warning-text font-medium" : "text-text-primary"}`}>
        {d.toLocaleDateString("pt-BR")}
      </span>
      {isOver && <p className="text-xs text-danger-text mt-0.5">Prazo vencido</p>}
      {isClose && <p className="text-xs text-warning-text mt-0.5">{diffDays}d restantes</p>}
    </div>
  );
}

function SortIcon({
  k,
  sortKey,
  sortDir,
}: {
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}) {
  if (sortKey !== k) return <ArrowUp size={12} className="text-text-muted" />;
  return sortDir === "asc" ? (
    <ArrowUp size={12} className="text-primary-500" />
  ) : (
    <ArrowDown size={12} className="text-primary-500" />
  );
}

export function ObraTable({ obras, onEdit, onDelete, user }: Omit<ObraTableProps, "formatCurrency">) {
  const [sortKey, setSortKey] = useState<SortKey>("dataPrevisaoTermino");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...obras].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "nome") cmp = a.nome.localeCompare(b.nome);
    else if (sortKey === "orcamento") cmp = a.orcamento - b.orcamento;
    else if (sortKey === "valorExecutado") cmp = a.valorExecutado - b.valorExecutado;
    else {
      const da = new Date(a.dataPrevisaoTermino).getTime();
      const db = new Date(b.dataPrevisaoTermino).getTime();
      cmp = da - db;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  if (obras.length === 0) {
    return (
      <div className="py-16 text-center">
        <HardHat size={48} className="mx-auto text-text-muted mb-4" />
        <p className="text-text-secondary font-medium">Nenhuma obra encontrada</p>
        <p className="text-text-muted text-sm mt-1">Ajuste os filtros ou cadastre uma nova obra</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-surface-muted border-b border-border">
          <tr>
            <th
              className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase cursor-pointer hover:text-text-primary transition-colors"
              onClick={() => handleSort("nome")}
            >
              <div className="flex items-center gap-1">Obra <SortIcon k="nome" sortKey={sortKey} sortDir={sortDir} /></div>
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
              Local
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
              Status
            </th>
            <th
              className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden lg:table-cell cursor-pointer hover:text-text-primary transition-colors"
              onClick={() => handleSort("dataPrevisaoTermino")}
            >
              <div className="flex items-center gap-1">Previsão <SortIcon k="dataPrevisaoTermino" sortKey={sortKey} sortDir={sortDir} /></div>
            </th>
            <th
              className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase cursor-pointer hover:text-text-primary transition-colors"
              onClick={() => handleSort("orcamento")}
            >
              <div className="flex items-center justify-end gap-1">Orçamento <SortIcon k="orcamento" sortKey={sortKey} sortDir={sortDir} /></div>
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
              Execução
            </th>
            {(user?.role === "MASTER" || user?.role === "EDITOR") && (
              <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Ações</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((obra) => (
            <tr key={obra.id} className="hover:bg-surface-muted/50 transition-colors group">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                    <HardHat size={18} className="text-primary-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary text-sm truncate max-w-[180px]">{obra.nome}</p>
                    <p className="text-xs text-text-muted">{obra.codigo} · {TIPO_MAP[obra.tipo] ?? obra.tipo}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <MapPin size={13} className="text-text-muted shrink-0" />
                  <span className="truncate max-w-[140px]">{obra.cidade}/{obra.estado}</span>
                </div>
                <p className="text-xs text-text-muted truncate max-w-[160px] mt-0.5">{obra.logradouro}</p>
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={obra.status} />
              </td>
              <td className="py-3 px-4 hidden lg:table-cell">
                <div className="flex items-center gap-1.5">
                  <CalendarClock size={13} className="text-text-muted shrink-0" />
                  <DeadlineCell date={obra.dataPrevisaoTermino} status={obra.status} />
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <p className="font-semibold text-text-primary text-sm">{formatCurrency(obra.orcamento)}</p>
                <p className="text-xs text-text-muted">Resp.: {obra.responsavelTecnico}</p>
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                <ProgressCell
                  orcamento={obra.orcamento}
                  executado={obra.valorExecutado}
                  formatCurrency={formatCurrency}
                />
              </td>
              {(user?.role === "MASTER" || user?.role === "EDITOR") && (
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(obra)}
                      className="p-2 hover:bg-primary-50 cursor-pointer text-text-secondary hover:text-primary-700 rounded-md transition-colors"
                      title="Gerenciar obra"
                    >
                      <FileText size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(obra)}
                      className="p-2 hover:bg-danger-bg cursor-pointer text-text-secondary hover:text-danger-text rounded-md transition-colors"
                      title="Excluir obra"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
