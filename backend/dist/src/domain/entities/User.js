export class User {
    id;
    name;
    email;
    password;
    role;
    constructor(props) {
        this.id = props.id;
        this.name = props.name;
        this.email = props.email;
        this.password = props.password;
        this.role = props.role ?? "USER";
    }
}
//# sourceMappingURL=User.js.map