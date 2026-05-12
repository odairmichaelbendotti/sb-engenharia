export type EmpenhoType = {
    numero: string;
    description: string;
    startAt: string;
    endAt: string;
    value: number;
    company_id: string;
};
export declare class EmpenhoEntity {
    readonly numero: string;
    readonly description: string;
    readonly startAt: string;
    readonly endAt: string;
    readonly value: number;
    readonly company_id: string;
    constructor(props: EmpenhoType);
}
//# sourceMappingURL=Empenho.d.ts.map