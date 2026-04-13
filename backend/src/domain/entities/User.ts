type UserProps = {
  id?: string;
  name: string;
  email: string;
  password: string;
  role?: "MASTER" | "USER" | "EDITOR";
};

export class User {
  public id?: string | undefined;
  public name: string;
  public readonly email: string;
  public readonly password: string;
  public role: string;

  constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
    this.role = props.role ?? "USER";
  }
}
