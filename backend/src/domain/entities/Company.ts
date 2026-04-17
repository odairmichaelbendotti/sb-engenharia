export type CompanyType = {
  name: string;
  cnpj: string;
  cep: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
};

export class CompanyEntity {
  public readonly name: string;
  public readonly cnpj: string;
  public readonly cep: string;
  public readonly city: string;
  public readonly state: string;
  public readonly address: string;
  public readonly phone: string;
  public readonly email: string;

  constructor(props: CompanyType) {
    this.name = props.name;
    this.cnpj = props.cnpj;
    this.cep = props.cep;
    this.city = props.city;
    this.state = props.state;
    this.address = props.address;
    this.phone = props.phone;
    this.email = props.email;
  }
}
