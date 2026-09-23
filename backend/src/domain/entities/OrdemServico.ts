import { DomainError } from "../errors/DomainError.js";

export type OrdemServicoStatusValue = "ATIVO" | "FINALIZADO" | "CANCELADO";

export type OrdemServicoType = {
  numero: string;
  valor: number;
  empenho_id: string;
  tenant_id: string;
};

export type PersistedOrdemServico = {
  id: string;
  numero: string;
  valor: number;
  status: OrdemServicoStatusValue;
  empenho_id: string;
  tenant_id: string;
  createdAt: Date;
  updatedAt: Date;
};

export class OrdemServicoEntity {
  public readonly numero: string;
  public readonly valor: number;
  public readonly empenho_id: string;
  public readonly tenant_id: string;

  constructor(props: OrdemServicoType) {
    if (!props.numero.trim()) {
      throw new DomainError("OrdemServico numero is required");
    }
    if (props.valor <= 0) {
      throw new DomainError("OrdemServico valor must be greater than 0");
    }

    this.numero = props.numero;
    this.valor = props.valor;
    this.empenho_id = props.empenho_id;
    this.tenant_id = props.tenant_id;
  }
}
