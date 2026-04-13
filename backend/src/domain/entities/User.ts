type UserProps = {
  id?: string;
  name: string;
  email: string;
  password: string;
  admin?: boolean;
};

export class User {
  public id?: string | undefined;
  public name: string;
  public readonly email: string;
  public readonly password: string;
  public admin: boolean | undefined;

  constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
    this.admin = props.admin ?? false;
  }
}
