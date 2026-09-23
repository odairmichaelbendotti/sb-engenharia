import { DomainError } from "../errors/DomainError.js";

export type EmpenhoCategoryValue =
  | "MANUTENCAO_PREDIAL"
  | "ALIMENTACAO"
  | "HOSPITALAR"
  | "COMBUSTIVEL"
  | "TECNOLOGIA"
  | "LIMPEZA_CONSERVACAO"
  | "SEGURANCA_VIGILANCIA"
  | "OUTROS";

export type EmpenhoType = {
  numero: string;
  description: string;
  category: EmpenhoCategoryValue;
  startAt: string;
  endAt: string;
  value: number;
  contrato_id: string;
  tenant_id: string;
};

export type PersistedEmpenho = {
  id: string;
  numero: string;
  description: string;
  category: EmpenhoCategoryValue;
  startAt: Date;
  endAt: Date;
  value: number;
  totalPaid: number;
  status: "ATIVO" | "FINALIZADO" | "CANCELADO";
  contrato_id: string;
  tenant_id: string;
  createdAt: Date;
  updatedAt: Date;
};

export class EmpenhoEntity {
  public readonly numero: string;
  public readonly description: string;
  public readonly category: EmpenhoCategoryValue;
  public readonly startAt: string;
  public readonly endAt: string;
  public readonly value: number;
  public readonly contrato_id: string;
  public readonly tenant_id: string;

  constructor(props: EmpenhoType) {
    if (props.value <= 0) {
      throw new DomainError("Empenho value must be greater than 0");
    }

    if (new Date(props.startAt) >= new Date(props.endAt)) {
      throw new DomainError("Empenho startAt must be before endAt");
    }

    this.numero = props.numero;
    this.description = props.description;
    this.category = props.category;
    this.startAt = props.startAt;
    this.endAt = props.endAt;
    this.value = props.value;
    this.contrato_id = props.contrato_id;
    this.tenant_id = props.tenant_id;
  }
}
