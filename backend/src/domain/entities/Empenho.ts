export type EmpenhoType = {
  numero: string;
  description: string;
  startAt: string;
  endAt: string;
  value: number;
  company_id: string;
};

export class EmpenhoEntity {
  public readonly numero: string;
  public readonly description: string;
  public readonly startAt: string;
  public readonly endAt: string;
  public readonly value: number;
  public readonly company_id: string;

  constructor(props: EmpenhoType) {
    this.numero = props.numero;
    this.description = props.description;
    this.startAt = props.startAt;
    this.endAt = props.endAt;
    this.value = props.value;
    this.company_id = props.company_id;
  }
}
