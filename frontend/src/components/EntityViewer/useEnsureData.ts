import { useEffect, useState } from "react";
import { useInvoice } from "../../store/invoices";
import { useEmpenhos } from "../../store/empenhos";
import { useContratos } from "../../store/contratos";
import { useCompanies } from "../../store/companies";
import { useOrdensServico } from "../../store/ordensServico";
import { useObras } from "../../store/obras";

export type DataSource = "invoices" | "empenhos" | "contratos" | "companies" | "ordensServico" | "obras";

// Uma busca por lista em andamento por vez, mesmo com vários modais pedindo a mesma coisa
const inflight = new Map<DataSource, Promise<boolean>>();

// Resolve `true` quando a lista chegou, `false` quando a busca falhou
function load(source: DataSource): Promise<boolean> {
  const running = inflight.get(source);
  if (running) return running;
  const loaders: Record<DataSource, () => Promise<unknown>> = {
    invoices: () => useInvoice.getState().list(),
    empenhos: () => useEmpenhos.getState().fetchListEmpenhos(),
    contratos: () => useContratos.getState().fetchContratos(),
    companies: () => useCompanies.getState().listCompanies(),
    ordensServico: () => useOrdensServico.getState().fetchOrdensServico(),
    obras: () => useObras.getState().fetchObras(),
  };
  const promise = loaders[source]()
    .then(() => true)
    .catch(() => false)
    .finally(() => inflight.delete(source));
  inflight.set(source, promise);
  return promise;
}

function useIsLoaded(source: DataSource) {
  const invoices = useInvoice((s) => s.loaded);
  const empenhos = useEmpenhos((s) => s.data !== null);
  const contratos = useContratos((s) => s.data !== null);
  const companies = useCompanies((s) => s.loaded);
  const ordensServico = useOrdensServico((s) => s.data !== null);
  const obras = useObras((s) => s.data !== null);
  return { invoices, empenhos, contratos, companies, ordensServico, obras }[source];
}

/**
 * Garante que a lista de um tipo de registro está no store (o modal de visualização pode abrir
 * fora da página daquele registro). Devolve `true` enquanto ainda não carregou.
 * Com `enabled` falso (sem permissão para ver aquele domínio) não busca nada.
 */
export function useEnsureData(source: DataSource, enabled = true): boolean {
  const loaded = useIsLoaded(source);
  // Busca que falhou: para de mostrar "carregando" (o modal mostra "não encontrado")
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled || loaded) return;
    let active = true;
    void load(source).then((ok) => {
      if (active && !ok) setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [source, enabled, loaded]);
  return enabled && !loaded && !failed;
}
