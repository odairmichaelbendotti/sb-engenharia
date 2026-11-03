import { ListFilter } from "lucide-react";
import { SearchInput } from "../../components/filters/SearchInput";
import { SegmentedControl } from "../../components/ui";
import type { FiltroMedicao } from "./medicao-filters";

export function MedicaoItemFilters({ filtro, onFiltro, busca, onBusca, pendentes, nesta, todos, visiveis, leitura = false }: {
  filtro: FiltroMedicao;
  onFiltro: (filtro: FiltroMedicao) => void;
  busca: string;
  onBusca: (busca: string) => void;
  pendentes: number;
  nesta: number;
  todos: number;
  visiveis: number;
  leitura?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col xl:flex-row xl:items-center gap-2">
        <SegmentedControl<FiltroMedicao>
          label="Quais itens mostrar"
          value={filtro}
          onChange={onFiltro}
          options={[
            { value: "pendentes", label: `Falta medir (${pendentes})`, icon: ListFilter, tone: "warning" },
            { value: "nesta", label: `Nesta medição (${nesta})` },
            { value: "todos", label: `Todos (${todos})` },
          ]}
        />
        <SearchInput value={busca} onChange={onBusca} placeholder="Buscar por código ou descrição..." />
      </div>
      <p className="text-xs text-text-secondary" role="status">
        <span className="font-semibold">{visiveis} {visiveis === 1 ? "item exibido" : "itens exibidos"}.</span>{" "}
        {filtro === "pendentes"
          ? leitura
            ? "Itens com saldo após esta medição, inclusive os que não foram lançados nela."
            : "Itens com saldo restante, já descontando o que você digitou nesta medição."
          : filtro === "nesta"
            ? "Somente itens com quantidade lançada nesta medição."
            : "Todos os itens do orçamento, incluindo concluídos e suprimidos."}
      </p>
    </div>
  );
}
