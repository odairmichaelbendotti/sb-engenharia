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
  latitude: number;
  longitude: number;
};

export type PersistedTenant = Omit<TenantType, "latitude" | "longitude"> & {
  id: string;
  latitude: number | null;
  longitude: number | null;
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
  public readonly latitude: number;
  public readonly longitude: number;
  constructor(props: TenantType) {
    if (props.cnpj.replace(/\D/g, "").length !== 14) {
      throw new DomainError("Tenant cnpj must have 14 digits");
    }
    if (props.latitude < -90 || props.latitude > 90 || props.longitude < -180 || props.longitude > 180) {
      throw new DomainError("Tenant latitude/longitude out of range");
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
    this.latitude = props.latitude;
    this.longitude = props.longitude;
  }
}
