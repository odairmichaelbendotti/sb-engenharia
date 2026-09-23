import type { EmpenhoType, PersistedEmpenho } from "../entities/Empenho.js";

export type UpdateStatusDTO = "ATIVO" | "FINALIZADO" | "CANCELADO";

export type empenhosDTO = {
  empenhos: (PersistedEmpenho & {
    contrato: {
      id: string;
      identificador: string;
      descricaoCurta: string;
      company: {
        id: string;
        name: string;
        cnpj: string;
      };
    };
    /** Soma do valor das ordens de serviço não canceladas vinculadas a este empenho. */
    valorComprometido: number;
    /** Valor do empenho - valorComprometido. */
    saldoDisponivel: number;
  })[];
  totalEmpenhos: number;
  totalEmpenhosAmount: number;
  activeEmpenhos: number;
  activeEmpenhosAmount: number;
  completedEmpenhos: number;
  completedEmpenhosAmount: number;
};

export type EmpenhoSummaryByTenant = {
  tenant_id: string;
  ativos: number;
  valorAtivos: number;
};

export interface IEmpenhoRepository {
  create(empenho: EmpenhoType): Promise<PersistedEmpenho>;
  findByEmpenhoId(empenhoId: string): Promise<PersistedEmpenho | null>;
  list(tenant_id?: string): Promise<empenhosDTO>;
  /** Contagem e valor de empenhos ativos, agrupados por tenant — resumo multi-institucional do PLATFORM_ADMIN. */
  summaryByTenant(): Promise<EmpenhoSummaryByTenant[]>;
  delete(id: string): Promise<void>;
  update(empenhoId: string, empenho: EmpenhoType): Promise<PersistedEmpenho>;
  updateStatus(
    empenhoId: string,
    status: "ATIVO" | "FINALIZADO" | "CANCELADO",
  ): Promise<PersistedEmpenho>;
  incrementInvoiceValue(empenhoId: string, value: number): Promise<void>;
  /**
   * Saldo disponível do empenho (valor total - soma das ordens de serviço não canceladas).
   * `excludeOrdemServicoId` desconsidera uma OS específica da soma já consumida —
   * usado ao editar uma OS existente, pra não contar ela contra si mesma.
   */
  getSaldoDisponivel(empenhoId: string, excludeOrdemServicoId?: string): Promise<number>;
}
