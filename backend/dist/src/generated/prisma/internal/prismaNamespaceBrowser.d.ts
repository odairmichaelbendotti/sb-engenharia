import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models.js';
export type * from './prismaNamespace.js';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: import("@prisma/client-runtime-utils").DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
export declare const ModelName: {
    readonly User: "User";
    readonly Company: "Company";
    readonly Empenho: "Empenho";
    readonly NotaFiscal: "NotaFiscal";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly email: "email";
    readonly password: "password";
    readonly role: "role";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const CompanyScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly cnpj: "cnpj";
    readonly cep: "cep";
    readonly city: "city";
    readonly state: "state";
    readonly address: "address";
    readonly phone: "phone";
    readonly email: "email";
    readonly hasActiveContract: "hasActiveContract";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type CompanyScalarFieldEnum = (typeof CompanyScalarFieldEnum)[keyof typeof CompanyScalarFieldEnum];
export declare const EmpenhoScalarFieldEnum: {
    readonly id: "id";
    readonly numero: "numero";
    readonly description: "description";
    readonly startAt: "startAt";
    readonly endAt: "endAt";
    readonly value: "value";
    readonly totalPaid: "totalPaid";
    readonly status: "status";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
    readonly company_id: "company_id";
};
export type EmpenhoScalarFieldEnum = (typeof EmpenhoScalarFieldEnum)[keyof typeof EmpenhoScalarFieldEnum];
export declare const NotaFiscalScalarFieldEnum: {
    readonly id: "id";
    readonly numero: "numero";
    readonly description: "description";
    readonly vencimento: "vencimento";
    readonly value: "value";
    readonly status: "status";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
    readonly empenho_id: "empenho_id";
    readonly company_id: "company_id";
};
export type NotaFiscalScalarFieldEnum = (typeof NotaFiscalScalarFieldEnum)[keyof typeof NotaFiscalScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map