import { FileSignature } from "lucide-react";
import type { EmpenhoFilterOption } from "./empenho-options";

interface EmpenhoFilterSelectProps {
  options: EmpenhoFilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function EmpenhoFilterSelect({ options, value, onChange, className = "sm:w-64" }: EmpenhoFilterSelectProps) {
  return (
    <label className={`relative ${className}`}>
      <span className="sr-only">Filtrar por empenho</span>
      <FileSignature
        size={14}
        className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
          value ? "text-primary-500" : "text-text-muted"
        }`}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-8 pr-3 py-2 border rounded-lg bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 cursor-pointer ${
          value ? "border-primary-300 font-medium" : "border-border"
        }`}
      >
        <option value="">Todos os empenhos</option>
        {options.map((empenho) => (
          <option key={empenho.id} value={empenho.id}>
            {empenho.numero} · {empenho.companyName} ({empenho.count})
          </option>
        ))}
      </select>
    </label>
  );
}
