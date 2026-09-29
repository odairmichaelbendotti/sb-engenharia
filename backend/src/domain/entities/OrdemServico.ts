import { DomainError } from "../errors/DomainError.js";

export type OrdemServicoStatusValue = "ATIVO" | "FINALIZADO" | "CANCELADO";

// Quanto de um empenho vai para a OS (em reais na entrada; centavos na persistência)
export type OrdemServicoEmpenhoInput = {
  empenho_id: string;
  valor: number;
};

export type OrdemServicoType = {
  numero: string;
  empenhos: OrdemServicoEmpenhoInput[];
  tenant_id: string;
};

export type PersistedOrdemServico = {
  id: string;
  numero: string;
  valor: number;
  status: OrdemServicoStatusValue;
  // Empenho principal (o primeiro vinculado) — define o contrato da OS
  empenho_id: string;
  tenant_id: string;
  createdAt: Date;
  updatedAt: Date;
};

export class OrdemServicoEntity {
  public readonly numero: string;
  public readonly empenhos: OrdemServicoEmpenhoInput[];
  public readonly tenant_id: string;

  constructor(props: OrdemServicoType) {
    if (!props.numero.trim()) {
      throw new DomainError("OrdemServico numero is required");
    }
    if (props.empenhos.length === 0) {
      throw new DomainError("OrdemServico must have at least one empenho");
    }
    const ids = new Set(props.empenhos.map((e) => e.empenho_id));
    if (ids.size !== props.empenhos.length) {
      throw new DomainError("The same empenho cannot be linked twice to an OrdemServico");
    }
    if (props.empenhos.some((e) => !e.empenho_id || !(e.valor > 0))) {
      throw new DomainError("Each linked empenho must have a valor greater than 0");
    }

    this.numero = props.numero;
    this.empenhos = props.empenhos;
    this.tenant_id = props.tenant_id;
  }

  /** Valor da OS = soma do que cada empenho destina a ela. */
  get valor(): number {
    return this.empenhos.reduce((sum, e) => sum + e.valor, 0);
  }

  /** Empenho principal: o primeiro da lista. */
  get empenhoPrincipalId(): string {
    return this.empenhos[0]!.empenho_id;
  }
}
