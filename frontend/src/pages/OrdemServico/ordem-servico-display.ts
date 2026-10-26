import type { OrdemServico } from "../../../types/ordem-servico";
import type { StatusDisplay } from "../../utils/status-display";
import { isQuitada } from "./ordem-servico-balance";
import { getFaseEmissao, describePrazoCiencia } from "./ordem-servico-ciencia";
import { getOrdemServicoSchedule } from "./ordem-servico-schedule";

/**
 * Selo de status da OS na lista e no modal. A situação que pede ação aparece no próprio selo:
 * ciência pendente ou vencida, quitada (pronta para finalizar) e prazo vencido.
 */
export function ordemServicoStatusDisplay(os: OrdemServico): StatusDisplay {
  if (os.status === "CANCELADO") return { label: "Cancelada", tone: "closed" };
  if (os.status === "FINALIZADO") return { label: "Finalizada", tone: "closed" };

  const fase = getFaseEmissao(os);
  if (fase === "CIENCIA_VENCIDA") {
    return { label: "Ciência vencida", tone: "danger", title: "A empresa não deu ciência dentro do prazo" };
  }
  if (fase === "AGUARDANDO_CIENCIA") {
    return {
      label: "Aguardando ciência",
      tone: "warning",
      title: os.cienciaPrazoAte ? `Prazo da empresa: ${describePrazoCiencia(os.cienciaPrazoAte)}` : undefined,
    };
  }
  if (isQuitada(os)) return { label: "Quitada", tone: "success", title: "Todo o valor liquidado: pronta para finalizar" };

  const schedule = getOrdemServicoSchedule(os);
  if (schedule.kind === "overdue") return { label: "Ativa", tone: "danger", title: schedule.label };
  return { label: "Ativa", tone: "active" };
}
