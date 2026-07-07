import { DomainError } from "../errors/DomainError.js";

export type InvoiceType = {
  numero: string;
  description: string;
  vencimento: Date;
  value: number;
  empenho_id: string;
  company_id: string;
};

export type PersistedInvoice = InvoiceType & {
  id: string;
  status: "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO";
  createdAt: Date;
  updatedAt: Date;
};

export class Invoice {
  public numero: string;
  public description: string;
  public vencimento: Date;
  public value: number;
  public empenho_id: string;
  public company_id: string;

  constructor(props: InvoiceType) {
    if (props.value <= 0) {
      throw new DomainError("Invoice value must be greater than 0");
    }

    this.numero = props.numero;
    this.description = props.description;
    this.vencimento = props.vencimento;
    this.value = props.value;
    this.empenho_id = props.empenho_id;
    this.company_id = props.company_id;
  }
}
