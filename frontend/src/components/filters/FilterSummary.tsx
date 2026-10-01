interface FilterSummaryProps {
  count: number;
  searchTerm?: string;
  // Número do empenho filtrado, se houver
  empenhoNumero?: string | undefined;
  // Outros filtros ativos, já em texto (ex.: "vencidas")
  extra?: string | undefined;
  onClear: () => void;
}

// Linha "N resultados ... · Limpar filtros", igual nas listagens; só aparece com filtro ativo
export function FilterSummary({ count, searchTerm, empenhoNumero, extra, onClear }: FilterSummaryProps) {
  if (!searchTerm && !empenhoNumero && !extra) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted">
      <span>
        {count} resultado{count !== 1 ? "s" : ""}
        {extra && <> {extra}</>}
        {searchTerm && <> para "{searchTerm}"</>}
        {empenhoNumero && <> no empenho {empenhoNumero}</>}
      </span>
      <button onClick={onClear} className="text-primary-500 hover:text-primary-600 font-medium cursor-pointer">
        Limpar filtros
      </button>
    </div>
  );
}
