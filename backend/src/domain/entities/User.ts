type UserProps = {
  id?: string;
  name: string;
  email: string;
  password: string;
  admin?: boolean;
};

export class User {
  private _id?: string | undefined;
  public name: string;
  public readonly email: string;
  public readonly password: string;
  private _admin: boolean | undefined;

  constructor(props: UserProps) {
    this._id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
    this._admin = props.admin ?? false;
  }
}
