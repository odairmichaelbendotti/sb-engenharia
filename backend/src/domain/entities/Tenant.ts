import { DomainError } from "../errors/DomainError.js";

export type TenantType = {
  name: string;
  apelido: string;
  cnpj: string;
  cep: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
};

export type PersistedTenant = TenantType & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export class TenantEntity {
  public readonly name: string;
  public readonly apelido: string;
  public readonly cnpj: string;
  public readonly cep: string;
  public readonly city: string;
  public readonly state: string;
  public readonly address: string;
  public readonly phone: string;
  public readonly email: string;
  constructor(props: TenantType) {
    if (props.cnpj.replace(/\D/g, "").length !== 14) {
      throw new DomainError("Tenant cnpj must have 14 digits");
    }

    this.name = props.name;
    this.apelido = props.apelido;
    this.cnpj = props.cnpj;
    this.cep = props.cep;
    this.city = props.city;
    this.state = props.state;
    this.address = props.address;
    this.phone = props.phone;
    this.email = props.email;
  }
}
