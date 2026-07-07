import { DomainError } from "../errors/DomainError.js";

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

export type PersistedCompany = CompanyType & {
  id: string;
  hasActiveContract: boolean;
  createdAt: Date;
  updatedAt: Date;
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
    if (props.cnpj.replace(/\D/g, "").length !== 14) {
      throw new DomainError("Company cnpj must have 14 digits");
    }

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
