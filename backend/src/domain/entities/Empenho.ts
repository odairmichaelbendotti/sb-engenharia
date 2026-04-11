export type EmpenhoType = {
  numero: string;
  description: string;
  startAt: Date;
  endAt: Date;
  value: number;
  company_id: string;
};

export class EmpenhoEntity {
  public readonly numero: string;
  public readonly description: string;
  public readonly startAt: Date;
  public readonly endAt: Date;
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
