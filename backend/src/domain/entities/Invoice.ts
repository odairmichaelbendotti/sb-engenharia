export type NotaFiscalType = {
  numero: string;
  description: string;
  vencimento: Date;
  value: number;
  empenho_id: string;
  company_id: string;
};

export class NotaFiscal {
  public numero: string;
  public description: string;
  public vencimento: Date;
  public value: number;
  public empenho_id: string;
  public company_id: string;

  constructor(props: NotaFiscalType) {
    this.numero = props.numero;
    this.description = props.description;
    this.vencimento = props.vencimento;
    this.value = props.value;
    this.empenho_id = props.empenho_id;
    this.company_id = props.company_id;
  }
}
