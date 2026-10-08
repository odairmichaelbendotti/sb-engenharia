import type { ScopeFilter } from "../../hooks/useScopeFilter";

// Origem de um item da lista (NF, OS ou obra): uma combinação empresa/contrato/empenho.
// Um item pode ter várias (OS com vários empenhos, obra com várias OS)
export type ScopeRef = {
  empresa: { id: string; name: string };
  contrato: { id: string; identificador: string } | null;
  empenho: { id: string; numero: string };
};

export type ScopeOption = {
  id: string;
  label: string;
  // Quantos itens da lista têm essa origem (dentro do recorte dos filtros acima dele)
  count: number;
};

export type ScopeOptions = { empresas: ScopeOption[]; contratos: ScopeOption[]; empenhos: ScopeOption[] };

type Level = keyof ScopeFilter;

function refId(ref: ScopeRef, level: Level) {
  if (level === "empresa") return ref.empresa.id;
  if (level === "contrato") return ref.contrato?.id ?? "";
  return ref.empenho.id;
}

function refLabel(ref: ScopeRef, level: Level) {
  if (level === "empresa") return ref.empresa.name;
  if (level === "contrato") return ref.contrato?.identificador ?? "";
  return ref.empenho.numero;
}

function refMatches(ref: ScopeRef, scope: Partial<ScopeFilter>) {
  return (["empresa", "contrato", "empenho"] as const).every((level) => !scope[level] || refId(ref, level) === scope[level]);
}

// O item entra no recorte se alguma das suas origens bate com todos os filtros escolhidos
export function matchesScope(refs: ScopeRef[], scope: ScopeFilter) {
  if (!scope.empresa && !scope.contrato && !scope.empenho) return true;
  return refs.some((ref) => refMatches(ref, scope));
}

function buildLevel<T>(items: T[], getRefs: (item: T) => ScopeRef[], level: Level, above: Partial<ScopeFilter>) {
  const byId = new Map<string, ScopeOption>();
  for (const item of items) {
    const seen = new Set<string>();
    for (const ref of getRefs(item)) {
      if (!refMatches(ref, above)) continue;
      const id = refId(ref, level);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const entry = byId.get(id);
      if (entry) entry.count += 1;
      else byId.set(id, { id, label: refLabel(ref, level), count: 1 });
    }
  }
  return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

/**
 * Monta as opções em cascata (empresa → contrato → empenho) a partir da própria lista e devolve o
 * recorte que vale nesta tela: valor escolhido em outra tela que não existe aqui é ignorado.
 */
export function resolveScope<T>(items: T[], getRefs: (item: T) => ScopeRef[], scope: ScopeFilter) {
  const empresas = buildLevel(items, getRefs, "empresa", {});
  const empresa = empresas.some((o) => o.id === scope.empresa) ? scope.empresa : "";

  const contratos = buildLevel(items, getRefs, "contrato", { empresa });
  const contrato = contratos.some((o) => o.id === scope.contrato) ? scope.contrato : "";

  const empenhos = buildLevel(items, getRefs, "empenho", { empresa, contrato });
  const empenho = empenhos.some((o) => o.id === scope.empenho) ? scope.empenho : "";

  return {
    options: { empresas, contratos, empenhos } satisfies ScopeOptions,
    active: { empresa, contrato, empenho } satisfies ScopeFilter,
  };
}

export type FilterChip = { key: string; label: string; onRemove: () => void };

// Etiquetas do recorte empresa/contrato/empenho; remover um nível limpa os que dependem dele
export function scopeChips(
  active: ScopeFilter,
  options: ScopeOptions,
  onChange: (patch: Partial<ScopeFilter>) => void,
): FilterChip[] {
  const chips: FilterChip[] = [];
  const label = (list: ScopeOption[], id: string) => list.find((o) => o.id === id)?.label ?? "";
  if (active.empresa) {
    chips.push({
      key: "empresa",
      label: label(options.empresas, active.empresa),
      onRemove: () => onChange({ empresa: "", contrato: "", empenho: "" }),
    });
  }
  if (active.contrato) {
    chips.push({
      key: "contrato",
      label: `Contrato ${label(options.contratos, active.contrato)}`,
      onRemove: () => onChange({ contrato: "", empenho: "" }),
    });
  }
  if (active.empenho) {
    chips.push({
      key: "empenho",
      label: `Empenho ${label(options.empenhos, active.empenho)}`,
      onRemove: () => onChange({ empenho: "" }),
    });
  }
  return chips;
}
