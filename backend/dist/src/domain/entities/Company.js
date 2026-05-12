export class CompanyEntity {
    name;
    cnpj;
    cep;
    city;
    state;
    address;
    phone;
    email;
    constructor(props) {
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
//# sourceMappingURL=Company.js.map