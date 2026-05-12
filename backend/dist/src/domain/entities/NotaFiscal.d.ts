export type NotaFiscalType = {
    numero: string;
    description: string;
    vencimento: Date;
    value: number;
    empenho_id: string;
    company_id: string;
};
export declare class NotaFiscal {
    numero: string;
    description: string;
    vencimento: Date;
    value: number;
    empenho_id: string;
    company_id: string;
    constructor(props: NotaFiscalType);
}
//# sourceMappingURL=NotaFiscal.d.ts.map