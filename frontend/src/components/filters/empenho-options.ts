export type EmpenhoFilterOption = {
  id: string;
  numero: string;
  companyName: string;
  // Quantos itens da lista (NF, OS ou obra) são desse empenho
  count: number;
};

type EmpenhoRef = { id: string; numero: string; companyName: string };

// Monta as opções do filtro a partir da própria lista; cada item conta uma vez por empenho
export function buildEmpenhoOptions<T>(items: T[], getEmpenhos: (item: T) => EmpenhoRef[]): EmpenhoFilterOption[] {
  const byId = new Map<string, EmpenhoFilterOption>();
  for (const item of items) {
    const seen = new Set<string>();
    for (const empenho of getEmpenhos(item)) {
      if (seen.has(empenho.id)) continue;
      seen.add(empenho.id);
      const entry = byId.get(empenho.id);
      if (entry) entry.count += 1;
      else byId.set(empenho.id, { ...empenho, count: 1 });
    }
  }
  return [...byId.values()].sort((a, b) => a.numero.localeCompare(b.numero));
}
