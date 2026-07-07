import { DomainError } from "../errors/DomainError.js";

export type EmpenhoType = {
  numero: string;
  description: string;
  startAt: string;
  endAt: string;
  value: number;
  company_id: string;
};

export type PersistedEmpenho = {
  id: string;
  numero: string;
  description: string;
  startAt: Date;
  endAt: Date;
  value: number;
  totalPaid: number;
  status: "ATIVO" | "FINALIZADO" | "CANCELADO";
  company_id: string;
  createdAt: Date;
  updatedAt: Date;
};

export class EmpenhoEntity {
  public readonly numero: string;
  public readonly description: string;
  public readonly startAt: string;
  public readonly endAt: string;
  public readonly value: number;
  public readonly company_id: string;

  constructor(props: EmpenhoType) {
    if (props.value <= 0) {
      throw new DomainError("Empenho value must be greater than 0");
    }

    if (new Date(props.startAt) >= new Date(props.endAt)) {
      throw new DomainError("Empenho startAt must be before endAt");
    }

    this.numero = props.numero;
    this.description = props.description;
    this.startAt = props.startAt;
    this.endAt = props.endAt;
    this.value = props.value;
    this.company_id = props.company_id;
  }
}
