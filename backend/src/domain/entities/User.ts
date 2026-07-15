import { DomainError } from "../errors/DomainError.js";

type UserProps = {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  password: string;
  approved: boolean;
  role: "PLATFORM_ADMIN" | "MASTER" | "COORDENACAO" | "ENGENHARIA" | "ADMINISTRATIVO" | "USER";
};

export class User {
  public id: string;
  public tenant_id: string;
  public name: string;
  public readonly email: string;
  public readonly password: string;
  public role: "PLATFORM_ADMIN" | "MASTER" | "COORDENACAO" | "ENGENHARIA" | "ADMINISTRATIVO" | "USER";
  public approved: boolean;

  constructor(props: UserProps) {
    if (!props.email.includes("@")) {
      throw new DomainError("User email is invalid");
    }

    this.id = props.id;
    this.tenant_id = props.tenant_id;
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
    this.role = props.role ?? "USER";
    this.approved = props.approved;
  }
}
