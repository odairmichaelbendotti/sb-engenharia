export class User {
  private _id: string | null;
  public _name: string;
  private _email: string;
  private _password: string;
  private _admin: boolean = false;
  constructor(
    id: string,
    name: string,
    email: string,
    password: string,
    admin: boolean,
  ) {
    this._id = id;
    this._name = name;
    this._email = email;
    this._password = password;
    this._admin = admin;
  }
}
