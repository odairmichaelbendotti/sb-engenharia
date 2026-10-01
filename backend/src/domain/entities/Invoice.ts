import { DomainError } from "../errors/DomainError.js";

export type InvoiceType = {
  numero: string;
  description: string;
  vencimento: Date;
  value: number;
  empenho_id: string;
  company_id: string;
  obra_id?: string | null | undefined;
  // OS da obra que a nota paga — mede a execução de cada OS
  ordemServico_id?: string | null | undefined;
};

export type InvoiceStatus = "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO";

export type UpdateInvoiceType = InvoiceType & { status?: InvoiceStatus };

export type PersistedInvoice = InvoiceType & {
  id: string;
  status: InvoiceStatus;
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
  public obra_id: string | null;
  public ordemServico_id: string | null;

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
    this.obra_id = props.obra_id ?? null;
    this.ordemServico_id = props.ordemServico_id ?? null;
  }
}
