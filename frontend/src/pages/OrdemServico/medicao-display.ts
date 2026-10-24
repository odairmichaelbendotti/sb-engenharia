import type { MedicaoStatus, MotivoBloqueioMedicao } from "../../../types/medicao";
import type { StatusDisplay } from "../../utils/status-display";
import { toFilename } from "../../utils/download-file";

// Rascunho = em elaboração (âmbar: aguarda a fiscalização fechar); fechada = encerrada (cinza)
export function medicaoStatusDisplay(status: MedicaoStatus): StatusDisplay {
  return status === "RASCUNHO"
    ? { label: "Rascunho", tone: "warning", title: "Em elaboração: ainda não entra no acumulado" }
    : { label: "Fechada", tone: "neutral", title: "Entra no acumulado e está travada" };
}

export const MOTIVO_BLOQUEIO_LABEL: Record<MotivoBloqueioMedicao, string> = {
  SEM_PERMISSAO: "Seu perfil só visualiza as medições",
  OS_INATIVA: "A OS não está ativa: orçamento e medições ficam só para consulta",
  SEM_ORCAMENTO: "Lance o orçamento antes de medir",
  RASCUNHO_ABERTO: "Já existe uma medição em rascunho",
  SEM_SALDO: "Todos os itens do orçamento já foram medidos",
};

export function medicaoTitulo(numero: number) {
  return `Medição ${String(numero).padStart(2, "0")}`;
}

export function medicaoFilename(numero: number, numeroOs: string) {
  return `Medicao-${String(numero).padStart(2, "0")}-${toFilename(numeroOs)}.pdf`;
}

/** Data pura da API ("2026-10-01T00:00:00.000Z") → valor do input de data */
export function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}
