export declare const UserRole: {
    readonly MASTER: "MASTER";
    readonly EDITOR: "EDITOR";
    readonly USER: "USER";
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export declare const EmpenhoStatus: {
    readonly ATIVO: "ATIVO";
    readonly FINALIZADO: "FINALIZADO";
    readonly CANCELADO: "CANCELADO";
};
export type EmpenhoStatus = (typeof EmpenhoStatus)[keyof typeof EmpenhoStatus];
export declare const NotaFiscalStatus: {
    readonly PENDENTE: "PENDENTE";
    readonly PAGO: "PAGO";
    readonly VENCIDO: "VENCIDO";
    readonly CANCELADO: "CANCELADO";
};
export type NotaFiscalStatus = (typeof NotaFiscalStatus)[keyof typeof NotaFiscalStatus];
//# sourceMappingURL=enums.d.ts.map