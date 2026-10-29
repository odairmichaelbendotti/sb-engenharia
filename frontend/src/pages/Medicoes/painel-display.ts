import type { PainelMedicaoItem } from "../../../types/medicao";
import type { ScopeRef } from "../../components/filters/scope-options";
import { medicaoTitulo } from "../OrdemServico/medicao-display";
import { fracaoMedida, fracaoPrazo, ritmoMedicao, type Ritmo } from "./medicao-progress";

export type PainelTab = "ATIVAS" | "PLANEJADAS" | "SEM_ORCAMENTO" | "RASCUNHO" | "CONCLUIDAS" | "ENCERRADAS";

export const PAINEL_TABS: { id: PainelTab; label: string; title: string }[] = [
  { id: "ATIVAS", label: "Ativas", title: "OS emitidas e ativas: orçamento e medições abertos para lançamento" },
  {
    id: "PLANEJADAS",
    label: "Planejadas",
    title: "OS ainda não emitidas: valor só planejado, fora dos totais; emita para medir",
  },
  { id: "SEM_ORCAMENTO", label: "Sem orçamento", title: "OS ativas que ainda não têm orçamento lançado" },
  { id: "RASCUNHO", label: "Rascunho aberto", title: "OS com uma medição em rascunho, ainda fora do acumulado" },
  { id: "CONCLUIDAS", label: "Medição concluída", title: "Todos os itens do orçamento já foram medidos" },
  { id: "ENCERRADAS", label: "Encerradas", title: "OS finalizadas ou canceladas: só consulta" },
];

export function matchesPainelTab(item: PainelMedicaoItem, tab: PainelTab) {
  if (tab === "ATIVAS") return item.status === "ATIVO" && !item.aguardandoEmissao;
  if (tab === "PLANEJADAS") return item.status === "ATIVO" && item.aguardandoEmissao;
  if (tab === "SEM_ORCAMENTO") return item.status === "ATIVO" && item.itens === 0;
  if (tab === "RASCUNHO") return item.rascunho !== null;
  if (tab === "CONCLUIDAS") return item.completo;
  return item.status !== "ATIVO";
}

// Uma OS pode ter vários empenhos (do mesmo contrato): uma origem por empenho, como na lista de OS
export function painelScopeRefs(item: PainelMedicaoItem): ScopeRef[] {
  return item.empenhos.map((e) => ({
    empresa: { id: item.empresa.id, name: item.empresa.name },
    contrato: { id: item.contrato.id, identificador: item.contrato.identificador },
    empenho: { id: e.id, numero: e.numero },
  }));
}

// O título é o serviço (nome da obra); sem obra, a descrição do empenho
export function painelTitulo(item: PainelMedicaoItem) {
  return item.obra?.nome ?? item.descricaoEmpenho;
}

/** Medido × prazo decorrido, só para OS ativa com orçamento e cronograma. */
export function painelRitmo(item: PainelMedicaoItem): Ritmo | null {
  if (item.status !== "ATIVO") return null;
  const medido = fracaoMedida(item.valorMedido, item.valorOrcado);
  const prazo = fracaoPrazo(item.dataInicio, item.dataPrevisaoTermino);
  return medido === null || prazo === null ? null : ritmoMedicao(medido, prazo);
}

export type PainelAcao = { label: string; title: string; to: string | null };

// Botão "Orçamento" da linha: lançar/editar para quem edita, consultar para os demais
export function acaoOrcamento(item: PainelMedicaoItem): PainelAcao {
  const to = `/medicoes/${item.id}/orcamento`;
  if (item.podeEditar) {
    return item.itens > 0
      ? { label: "Orçamento", title: "Editar o orçamento da OS", to }
      : { label: "Lançar orçamento", title: "Lançar os itens do orçamento da OS", to };
  }
  return item.itens > 0
    ? { label: "Ver orçamento", title: "Consultar o orçamento da OS", to }
    : { label: "Orçamento", title: "Nenhum orçamento lançado nesta OS", to: null };
}

// Botão "Medição" da linha: continua o rascunho, abre uma nova ou mostra as já feitas
export function acaoMedicao(item: PainelMedicaoItem): PainelAcao {
  const base = `/medicoes/${item.id}/medicoes`;
  if (item.rascunho) {
    return {
      label: `Continuar ${String(item.rascunho.numero).padStart(2, "0")}`,
      title: `Continuar a ${medicaoTitulo(item.rascunho.numero)} (rascunho)`,
      to: `${base}/${item.rascunho.id}`,
    };
  }
  if (item.podeEditar && item.itens > 0 && !item.completo) {
    return { label: "Nova medição", title: "Lançar uma nova medição", to: `${base}/nova` };
  }
  if (item.ultimaFechada) return { label: "Ver medições", title: "Consultar as medições da OS", to: base };
  return {
    label: "Medição",
    title: item.itens === 0 ? "Lance o orçamento antes de medir" : "Nenhuma medição lançada nesta OS",
    to: null,
  };
}

// OS antiga sem lote: o desconto ficou 0 e o orçamento lançado só com BDI vale com BDI
export const SEM_LOTE_DICA =
  "A OS não tem lote, então o desconto ficou 0%. Defina o lote na edição da OS: o orçamento lançado só com BDI recebe o desconto dele.";
