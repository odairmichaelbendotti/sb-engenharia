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
export declare class CompanyEntity {
    readonly name: string;
    readonly cnpj: string;
    readonly cep: string;
    readonly city: string;
    readonly state: string;
    readonly address: string;
    readonly phone: string;
    readonly email: string;
    constructor(props: CompanyType);
}
//# sourceMappingURL=Company.d.ts.map