import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
/**
 * Model Company
 *
 */
export type CompanyModel = runtime.Types.Result.DefaultSelection<Prisma.$CompanyPayload>;
export type AggregateCompany = {
    _count: CompanyCountAggregateOutputType | null;
    _min: CompanyMinAggregateOutputType | null;
    _max: CompanyMaxAggregateOutputType | null;
};
export type CompanyMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    cnpj: string | null;
    cep: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    hasActiveContract: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type CompanyMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    cnpj: string | null;
    cep: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    hasActiveContract: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type CompanyCountAggregateOutputType = {
    id: number;
    name: number;
    cnpj: number;
    cep: number;
    city: number;
    state: number;
    address: number;
    phone: number;
    email: number;
    hasActiveContract: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type CompanyMinAggregateInputType = {
    id?: true;
    name?: true;
    cnpj?: true;
    cep?: true;
    city?: true;
    state?: true;
    address?: true;
    phone?: true;
    email?: true;
    hasActiveContract?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type CompanyMaxAggregateInputType = {
    id?: true;
    name?: true;
    cnpj?: true;
    cep?: true;
    city?: true;
    state?: true;
    address?: true;
    phone?: true;
    email?: true;
    hasActiveContract?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type CompanyCountAggregateInputType = {
    id?: true;
    name?: true;
    cnpj?: true;
    cep?: true;
    city?: true;
    state?: true;
    address?: true;
    phone?: true;
    email?: true;
    hasActiveContract?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type CompanyAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Company to aggregate.
     */
    where?: Prisma.CompanyWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Companies to fetch.
     */
    orderBy?: Prisma.CompanyOrderByWithRelationInput | Prisma.CompanyOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.CompanyWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Companies from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Companies.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Companies
    **/
    _count?: true | CompanyCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: CompanyMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: CompanyMaxAggregateInputType;
};
export type GetCompanyAggregateType<T extends CompanyAggregateArgs> = {
    [P in keyof T & keyof AggregateCompany]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateCompany[P]> : Prisma.GetScalarType<T[P], AggregateCompany[P]>;
};
export type CompanyGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CompanyWhereInput;
    orderBy?: Prisma.CompanyOrderByWithAggregationInput | Prisma.CompanyOrderByWithAggregationInput[];
    by: Prisma.CompanyScalarFieldEnum[] | Prisma.CompanyScalarFieldEnum;
    having?: Prisma.CompanyScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: CompanyCountAggregateInputType | true;
    _min?: CompanyMinAggregateInputType;
    _max?: CompanyMaxAggregateInputType;
};
export type CompanyGroupByOutputType = {
    id: string;
    name: string;
    cnpj: string;
    cep: string;
    city: string;
    state: string;
    address: string;
    phone: string;
    email: string;
    hasActiveContract: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: CompanyCountAggregateOutputType | null;
    _min: CompanyMinAggregateOutputType | null;
    _max: CompanyMaxAggregateOutputType | null;
};
type GetCompanyGroupByPayload<T extends CompanyGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<CompanyGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof CompanyGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], CompanyGroupByOutputType[P]> : Prisma.GetScalarType<T[P], CompanyGroupByOutputType[P]>;
}>>;
export type CompanyWhereInput = {
    AND?: Prisma.CompanyWhereInput | Prisma.CompanyWhereInput[];
    OR?: Prisma.CompanyWhereInput[];
    NOT?: Prisma.CompanyWhereInput | Prisma.CompanyWhereInput[];
    id?: Prisma.StringFilter<"Company"> | string;
    name?: Prisma.StringFilter<"Company"> | string;
    cnpj?: Prisma.StringFilter<"Company"> | string;
    cep?: Prisma.StringFilter<"Company"> | string;
    city?: Prisma.StringFilter<"Company"> | string;
    state?: Prisma.StringFilter<"Company"> | string;
    address?: Prisma.StringFilter<"Company"> | string;
    phone?: Prisma.StringFilter<"Company"> | string;
    email?: Prisma.StringFilter<"Company"> | string;
    hasActiveContract?: Prisma.BoolFilter<"Company"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Company"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Company"> | Date | string;
    empenhos?: Prisma.EmpenhoListRelationFilter;
    notasFicais?: Prisma.NotaFiscalListRelationFilter;
};
export type CompanyOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    cnpj?: Prisma.SortOrder;
    cep?: Prisma.SortOrder;
    city?: Prisma.SortOrder;
    state?: Prisma.SortOrder;
    address?: Prisma.SortOrder;
    phone?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    hasActiveContract?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    empenhos?: Prisma.EmpenhoOrderByRelationAggregateInput;
    notasFicais?: Prisma.NotaFiscalOrderByRelationAggregateInput;
};
export type CompanyWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    cnpj?: string;
    AND?: Prisma.CompanyWhereInput | Prisma.CompanyWhereInput[];
    OR?: Prisma.CompanyWhereInput[];
    NOT?: Prisma.CompanyWhereInput | Prisma.CompanyWhereInput[];
    name?: Prisma.StringFilter<"Company"> | string;
    cep?: Prisma.StringFilter<"Company"> | string;
    city?: Prisma.StringFilter<"Company"> | string;
    state?: Prisma.StringFilter<"Company"> | string;
    address?: Prisma.StringFilter<"Company"> | string;
    phone?: Prisma.StringFilter<"Company"> | string;
    email?: Prisma.StringFilter<"Company"> | string;
    hasActiveContract?: Prisma.BoolFilter<"Company"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Company"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Company"> | Date | string;
    empenhos?: Prisma.EmpenhoListRelationFilter;
    notasFicais?: Prisma.NotaFiscalListRelationFilter;
}, "id" | "cnpj">;
export type CompanyOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    cnpj?: Prisma.SortOrder;
    cep?: Prisma.SortOrder;
    city?: Prisma.SortOrder;
    state?: Prisma.SortOrder;
    address?: Prisma.SortOrder;
    phone?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    hasActiveContract?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.CompanyCountOrderByAggregateInput;
    _max?: Prisma.CompanyMaxOrderByAggregateInput;
    _min?: Prisma.CompanyMinOrderByAggregateInput;
};
export type CompanyScalarWhereWithAggregatesInput = {
    AND?: Prisma.CompanyScalarWhereWithAggregatesInput | Prisma.CompanyScalarWhereWithAggregatesInput[];
    OR?: Prisma.CompanyScalarWhereWithAggregatesInput[];
    NOT?: Prisma.CompanyScalarWhereWithAggregatesInput | Prisma.CompanyScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Company"> | string;
    name?: Prisma.StringWithAggregatesFilter<"Company"> | string;
    cnpj?: Prisma.StringWithAggregatesFilter<"Company"> | string;
    cep?: Prisma.StringWithAggregatesFilter<"Company"> | string;
    city?: Prisma.StringWithAggregatesFilter<"Company"> | string;
    state?: Prisma.StringWithAggregatesFilter<"Company"> | string;
    address?: Prisma.StringWithAggregatesFilter<"Company"> | string;
    phone?: Prisma.StringWithAggregatesFilter<"Company"> | string;
    email?: Prisma.StringWithAggregatesFilter<"Company"> | string;
    hasActiveContract?: Prisma.BoolWithAggregatesFilter<"Company"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Company"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Company"> | Date | string;
};
export type CompanyCreateInput = {
    id?: string;
    name: string;
    cnpj: string;
    cep: string;
    city: string;
    state: string;
    address: string;
    phone: string;
    email: string;
    hasActiveContract?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    empenhos?: Prisma.EmpenhoCreateNestedManyWithoutCompanyInput;
    notasFicais?: Prisma.NotaFiscalCreateNestedManyWithoutCompanyInput;
};
export type CompanyUncheckedCreateInput = {
    id?: string;
    name: string;
    cnpj: string;
    cep: string;
    city: string;
    state: string;
    address: string;
    phone: string;
    email: string;
    hasActiveContract?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    empenhos?: Prisma.EmpenhoUncheckedCreateNestedManyWithoutCompanyInput;
    notasFicais?: Prisma.NotaFiscalUncheckedCreateNestedManyWithoutCompanyInput;
};
export type CompanyUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    cnpj?: Prisma.StringFieldUpdateOperationsInput | string;
    cep?: Prisma.StringFieldUpdateOperationsInput | string;
    city?: Prisma.StringFieldUpdateOperationsInput | string;
    state?: Prisma.StringFieldUpdateOperationsInput | string;
    address?: Prisma.StringFieldUpdateOperationsInput | string;
    phone?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    hasActiveContract?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    empenhos?: Prisma.EmpenhoUpdateManyWithoutCompanyNestedInput;
    notasFicais?: Prisma.NotaFiscalUpdateManyWithoutCompanyNestedInput;
};
export type CompanyUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    cnpj?: Prisma.StringFieldUpdateOperationsInput | string;
    cep?: Prisma.StringFieldUpdateOperationsInput | string;
    city?: Prisma.StringFieldUpdateOperationsInput | string;
    state?: Prisma.StringFieldUpdateOperationsInput | string;
    address?: Prisma.StringFieldUpdateOperationsInput | string;
    phone?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    hasActiveContract?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    empenhos?: Prisma.EmpenhoUncheckedUpdateManyWithoutCompanyNestedInput;
    notasFicais?: Prisma.NotaFiscalUncheckedUpdateManyWithoutCompanyNestedInput;
};
export type CompanyCreateManyInput = {
    id?: string;
    name: string;
    cnpj: string;
    cep: string;
    city: string;
    state: string;
    address: string;
    phone: string;
    email: string;
    hasActiveContract?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type CompanyUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    cnpj?: Prisma.StringFieldUpdateOperationsInput | string;
    cep?: Prisma.StringFieldUpdateOperationsInput | string;
    city?: Prisma.StringFieldUpdateOperationsInput | string;
    state?: Prisma.StringFieldUpdateOperationsInput | string;
    address?: Prisma.StringFieldUpdateOperationsInput | string;
    phone?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    hasActiveContract?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CompanyUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    cnpj?: Prisma.StringFieldUpdateOperationsInput | string;
    cep?: Prisma.StringFieldUpdateOperationsInput | string;
    city?: Prisma.StringFieldUpdateOperationsInput | string;
    state?: Prisma.StringFieldUpdateOperationsInput | string;
    address?: Prisma.StringFieldUpdateOperationsInput | string;
    phone?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    hasActiveContract?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CompanyCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    cnpj?: Prisma.SortOrder;
    cep?: Prisma.SortOrder;
    city?: Prisma.SortOrder;
    state?: Prisma.SortOrder;
    address?: Prisma.SortOrder;
    phone?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    hasActiveContract?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type CompanyMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    cnpj?: Prisma.SortOrder;
    cep?: Prisma.SortOrder;
    city?: Prisma.SortOrder;
    state?: Prisma.SortOrder;
    address?: Prisma.SortOrder;
    phone?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    hasActiveContract?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type CompanyMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    cnpj?: Prisma.SortOrder;
    cep?: Prisma.SortOrder;
    city?: Prisma.SortOrder;
    state?: Prisma.SortOrder;
    address?: Prisma.SortOrder;
    phone?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    hasActiveContract?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type CompanyScalarRelationFilter = {
    is?: Prisma.CompanyWhereInput;
    isNot?: Prisma.CompanyWhereInput;
};
export type BoolFieldUpdateOperationsInput = {
    set?: boolean;
};
export type CompanyCreateNestedOneWithoutEmpenhosInput = {
    create?: Prisma.XOR<Prisma.CompanyCreateWithoutEmpenhosInput, Prisma.CompanyUncheckedCreateWithoutEmpenhosInput>;
    connectOrCreate?: Prisma.CompanyCreateOrConnectWithoutEmpenhosInput;
    connect?: Prisma.CompanyWhereUniqueInput;
};
export type CompanyUpdateOneRequiredWithoutEmpenhosNestedInput = {
    create?: Prisma.XOR<Prisma.CompanyCreateWithoutEmpenhosInput, Prisma.CompanyUncheckedCreateWithoutEmpenhosInput>;
    connectOrCreate?: Prisma.CompanyCreateOrConnectWithoutEmpenhosInput;
    upsert?: Prisma.CompanyUpsertWithoutEmpenhosInput;
    connect?: Prisma.CompanyWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.CompanyUpdateToOneWithWhereWithoutEmpenhosInput, Prisma.CompanyUpdateWithoutEmpenhosInput>, Prisma.CompanyUncheckedUpdateWithoutEmpenhosInput>;
};
export type CompanyCreateNestedOneWithoutNotasFicaisInput = {
    create?: Prisma.XOR<Prisma.CompanyCreateWithoutNotasFicaisInput, Prisma.CompanyUncheckedCreateWithoutNotasFicaisInput>;
    connectOrCreate?: Prisma.CompanyCreateOrConnectWithoutNotasFicaisInput;
    connect?: Prisma.CompanyWhereUniqueInput;
};
export type CompanyUpdateOneRequiredWithoutNotasFicaisNestedInput = {
    create?: Prisma.XOR<Prisma.CompanyCreateWithoutNotasFicaisInput, Prisma.CompanyUncheckedCreateWithoutNotasFicaisInput>;
    connectOrCreate?: Prisma.CompanyCreateOrConnectWithoutNotasFicaisInput;
    upsert?: Prisma.CompanyUpsertWithoutNotasFicaisInput;
    connect?: Prisma.CompanyWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.CompanyUpdateToOneWithWhereWithoutNotasFicaisInput, Prisma.CompanyUpdateWithoutNotasFicaisInput>, Prisma.CompanyUncheckedUpdateWithoutNotasFicaisInput>;
};
export type CompanyCreateWithoutEmpenhosInput = {
    id?: string;
    name: string;
    cnpj: string;
    cep: string;
    city: string;
    state: string;
    address: string;
    phone: string;
    email: string;
    hasActiveContract?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    notasFicais?: Prisma.NotaFiscalCreateNestedManyWithoutCompanyInput;
};
export type CompanyUncheckedCreateWithoutEmpenhosInput = {
    id?: string;
    name: string;
    cnpj: string;
    cep: string;
    city: string;
    state: string;
    address: string;
    phone: string;
    email: string;
    hasActiveContract?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    notasFicais?: Prisma.NotaFiscalUncheckedCreateNestedManyWithoutCompanyInput;
};
export type CompanyCreateOrConnectWithoutEmpenhosInput = {
    where: Prisma.CompanyWhereUniqueInput;
    create: Prisma.XOR<Prisma.CompanyCreateWithoutEmpenhosInput, Prisma.CompanyUncheckedCreateWithoutEmpenhosInput>;
};
export type CompanyUpsertWithoutEmpenhosInput = {
    update: Prisma.XOR<Prisma.CompanyUpdateWithoutEmpenhosInput, Prisma.CompanyUncheckedUpdateWithoutEmpenhosInput>;
    create: Prisma.XOR<Prisma.CompanyCreateWithoutEmpenhosInput, Prisma.CompanyUncheckedCreateWithoutEmpenhosInput>;
    where?: Prisma.CompanyWhereInput;
};
export type CompanyUpdateToOneWithWhereWithoutEmpenhosInput = {
    where?: Prisma.CompanyWhereInput;
    data: Prisma.XOR<Prisma.CompanyUpdateWithoutEmpenhosInput, Prisma.CompanyUncheckedUpdateWithoutEmpenhosInput>;
};
export type CompanyUpdateWithoutEmpenhosInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    cnpj?: Prisma.StringFieldUpdateOperationsInput | string;
    cep?: Prisma.StringFieldUpdateOperationsInput | string;
    city?: Prisma.StringFieldUpdateOperationsInput | string;
    state?: Prisma.StringFieldUpdateOperationsInput | string;
    address?: Prisma.StringFieldUpdateOperationsInput | string;
    phone?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    hasActiveContract?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    notasFicais?: Prisma.NotaFiscalUpdateManyWithoutCompanyNestedInput;
};
export type CompanyUncheckedUpdateWithoutEmpenhosInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    cnpj?: Prisma.StringFieldUpdateOperationsInput | string;
    cep?: Prisma.StringFieldUpdateOperationsInput | string;
    city?: Prisma.StringFieldUpdateOperationsInput | string;
    state?: Prisma.StringFieldUpdateOperationsInput | string;
    address?: Prisma.StringFieldUpdateOperationsInput | string;
    phone?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    hasActiveContract?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    notasFicais?: Prisma.NotaFiscalUncheckedUpdateManyWithoutCompanyNestedInput;
};
export type CompanyCreateWithoutNotasFicaisInput = {
    id?: string;
    name: string;
    cnpj: string;
    cep: string;
    city: string;
    state: string;
    address: string;
    phone: string;
    email: string;
    hasActiveContract?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    empenhos?: Prisma.EmpenhoCreateNestedManyWithoutCompanyInput;
};
export type CompanyUncheckedCreateWithoutNotasFicaisInput = {
    id?: string;
    name: string;
    cnpj: string;
    cep: string;
    city: string;
    state: string;
    address: string;
    phone: string;
    email: string;
    hasActiveContract?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    empenhos?: Prisma.EmpenhoUncheckedCreateNestedManyWithoutCompanyInput;
};
export type CompanyCreateOrConnectWithoutNotasFicaisInput = {
    where: Prisma.CompanyWhereUniqueInput;
    create: Prisma.XOR<Prisma.CompanyCreateWithoutNotasFicaisInput, Prisma.CompanyUncheckedCreateWithoutNotasFicaisInput>;
};
export type CompanyUpsertWithoutNotasFicaisInput = {
    update: Prisma.XOR<Prisma.CompanyUpdateWithoutNotasFicaisInput, Prisma.CompanyUncheckedUpdateWithoutNotasFicaisInput>;
    create: Prisma.XOR<Prisma.CompanyCreateWithoutNotasFicaisInput, Prisma.CompanyUncheckedCreateWithoutNotasFicaisInput>;
    where?: Prisma.CompanyWhereInput;
};
export type CompanyUpdateToOneWithWhereWithoutNotasFicaisInput = {
    where?: Prisma.CompanyWhereInput;
    data: Prisma.XOR<Prisma.CompanyUpdateWithoutNotasFicaisInput, Prisma.CompanyUncheckedUpdateWithoutNotasFicaisInput>;
};
export type CompanyUpdateWithoutNotasFicaisInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    cnpj?: Prisma.StringFieldUpdateOperationsInput | string;
    cep?: Prisma.StringFieldUpdateOperationsInput | string;
    city?: Prisma.StringFieldUpdateOperationsInput | string;
    state?: Prisma.StringFieldUpdateOperationsInput | string;
    address?: Prisma.StringFieldUpdateOperationsInput | string;
    phone?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    hasActiveContract?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    empenhos?: Prisma.EmpenhoUpdateManyWithoutCompanyNestedInput;
};
export type CompanyUncheckedUpdateWithoutNotasFicaisInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    cnpj?: Prisma.StringFieldUpdateOperationsInput | string;
    cep?: Prisma.StringFieldUpdateOperationsInput | string;
    city?: Prisma.StringFieldUpdateOperationsInput | string;
    state?: Prisma.StringFieldUpdateOperationsInput | string;
    address?: Prisma.StringFieldUpdateOperationsInput | string;
    phone?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    hasActiveContract?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    empenhos?: Prisma.EmpenhoUncheckedUpdateManyWithoutCompanyNestedInput;
};
/**
 * Count Type CompanyCountOutputType
 */
export type CompanyCountOutputType = {
    empenhos: number;
    notasFicais: number;
};
export type CompanyCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    empenhos?: boolean | CompanyCountOutputTypeCountEmpenhosArgs;
    notasFicais?: boolean | CompanyCountOutputTypeCountNotasFicaisArgs;
};
/**
 * CompanyCountOutputType without action
 */
export type CompanyCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompanyCountOutputType
     */
    select?: Prisma.CompanyCountOutputTypeSelect<ExtArgs> | null;
};
/**
 * CompanyCountOutputType without action
 */
export type CompanyCountOutputTypeCountEmpenhosArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.EmpenhoWhereInput;
};
/**
 * CompanyCountOutputType without action
 */
export type CompanyCountOutputTypeCountNotasFicaisArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.NotaFiscalWhereInput;
};
export type CompanySelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    cnpj?: boolean;
    cep?: boolean;
    city?: boolean;
    state?: boolean;
    address?: boolean;
    phone?: boolean;
    email?: boolean;
    hasActiveContract?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    empenhos?: boolean | Prisma.Company$empenhosArgs<ExtArgs>;
    notasFicais?: boolean | Prisma.Company$notasFicaisArgs<ExtArgs>;
    _count?: boolean | Prisma.CompanyCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["company"]>;
export type CompanySelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    cnpj?: boolean;
    cep?: boolean;
    city?: boolean;
    state?: boolean;
    address?: boolean;
    phone?: boolean;
    email?: boolean;
    hasActiveContract?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["company"]>;
export type CompanySelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    cnpj?: boolean;
    cep?: boolean;
    city?: boolean;
    state?: boolean;
    address?: boolean;
    phone?: boolean;
    email?: boolean;
    hasActiveContract?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["company"]>;
export type CompanySelectScalar = {
    id?: boolean;
    name?: boolean;
    cnpj?: boolean;
    cep?: boolean;
    city?: boolean;
    state?: boolean;
    address?: boolean;
    phone?: boolean;
    email?: boolean;
    hasActiveContract?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type CompanyOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "name" | "cnpj" | "cep" | "city" | "state" | "address" | "phone" | "email" | "hasActiveContract" | "createdAt" | "updatedAt", ExtArgs["result"]["company"]>;
export type CompanyInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    empenhos?: boolean | Prisma.Company$empenhosArgs<ExtArgs>;
    notasFicais?: boolean | Prisma.Company$notasFicaisArgs<ExtArgs>;
    _count?: boolean | Prisma.CompanyCountOutputTypeDefaultArgs<ExtArgs>;
};
export type CompanyIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type CompanyIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $CompanyPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Company";
    objects: {
        empenhos: Prisma.$EmpenhoPayload<ExtArgs>[];
        notasFicais: Prisma.$NotaFiscalPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        cnpj: string;
        cep: string;
        city: string;
        state: string;
        address: string;
        phone: string;
        email: string;
        hasActiveContract: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["company"]>;
    composites: {};
};
export type CompanyGetPayload<S extends boolean | null | undefined | CompanyDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$CompanyPayload, S>;
export type CompanyCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<CompanyFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: CompanyCountAggregateInputType | true;
};
export interface CompanyDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Company'];
        meta: {
            name: 'Company';
        };
    };
    /**
     * Find zero or one Company that matches the filter.
     * @param {CompanyFindUniqueArgs} args - Arguments to find a Company
     * @example
     * // Get one Company
     * const company = await prisma.company.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CompanyFindUniqueArgs>(args: Prisma.SelectSubset<T, CompanyFindUniqueArgs<ExtArgs>>): Prisma.Prisma__CompanyClient<runtime.Types.Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one Company that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CompanyFindUniqueOrThrowArgs} args - Arguments to find a Company
     * @example
     * // Get one Company
     * const company = await prisma.company.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CompanyFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, CompanyFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__CompanyClient<runtime.Types.Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Company that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompanyFindFirstArgs} args - Arguments to find a Company
     * @example
     * // Get one Company
     * const company = await prisma.company.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CompanyFindFirstArgs>(args?: Prisma.SelectSubset<T, CompanyFindFirstArgs<ExtArgs>>): Prisma.Prisma__CompanyClient<runtime.Types.Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Company that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompanyFindFirstOrThrowArgs} args - Arguments to find a Company
     * @example
     * // Get one Company
     * const company = await prisma.company.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CompanyFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, CompanyFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__CompanyClient<runtime.Types.Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more Companies that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompanyFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Companies
     * const companies = await prisma.company.findMany()
     *
     * // Get first 10 Companies
     * const companies = await prisma.company.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const companyWithIdOnly = await prisma.company.findMany({ select: { id: true } })
     *
     */
    findMany<T extends CompanyFindManyArgs>(args?: Prisma.SelectSubset<T, CompanyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a Company.
     * @param {CompanyCreateArgs} args - Arguments to create a Company.
     * @example
     * // Create one Company
     * const Company = await prisma.company.create({
     *   data: {
     *     // ... data to create a Company
     *   }
     * })
     *
     */
    create<T extends CompanyCreateArgs>(args: Prisma.SelectSubset<T, CompanyCreateArgs<ExtArgs>>): Prisma.Prisma__CompanyClient<runtime.Types.Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many Companies.
     * @param {CompanyCreateManyArgs} args - Arguments to create many Companies.
     * @example
     * // Create many Companies
     * const company = await prisma.company.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends CompanyCreateManyArgs>(args?: Prisma.SelectSubset<T, CompanyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many Companies and returns the data saved in the database.
     * @param {CompanyCreateManyAndReturnArgs} args - Arguments to create many Companies.
     * @example
     * // Create many Companies
     * const company = await prisma.company.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Companies and only return the `id`
     * const companyWithIdOnly = await prisma.company.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends CompanyCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, CompanyCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a Company.
     * @param {CompanyDeleteArgs} args - Arguments to delete one Company.
     * @example
     * // Delete one Company
     * const Company = await prisma.company.delete({
     *   where: {
     *     // ... filter to delete one Company
     *   }
     * })
     *
     */
    delete<T extends CompanyDeleteArgs>(args: Prisma.SelectSubset<T, CompanyDeleteArgs<ExtArgs>>): Prisma.Prisma__CompanyClient<runtime.Types.Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one Company.
     * @param {CompanyUpdateArgs} args - Arguments to update one Company.
     * @example
     * // Update one Company
     * const company = await prisma.company.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends CompanyUpdateArgs>(args: Prisma.SelectSubset<T, CompanyUpdateArgs<ExtArgs>>): Prisma.Prisma__CompanyClient<runtime.Types.Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more Companies.
     * @param {CompanyDeleteManyArgs} args - Arguments to filter Companies to delete.
     * @example
     * // Delete a few Companies
     * const { count } = await prisma.company.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends CompanyDeleteManyArgs>(args?: Prisma.SelectSubset<T, CompanyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Companies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompanyUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Companies
     * const company = await prisma.company.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends CompanyUpdateManyArgs>(args: Prisma.SelectSubset<T, CompanyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Companies and returns the data updated in the database.
     * @param {CompanyUpdateManyAndReturnArgs} args - Arguments to update many Companies.
     * @example
     * // Update many Companies
     * const company = await prisma.company.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Companies and only return the `id`
     * const companyWithIdOnly = await prisma.company.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends CompanyUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, CompanyUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one Company.
     * @param {CompanyUpsertArgs} args - Arguments to update or create a Company.
     * @example
     * // Update or create a Company
     * const company = await prisma.company.upsert({
     *   create: {
     *     // ... data to create a Company
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Company we want to update
     *   }
     * })
     */
    upsert<T extends CompanyUpsertArgs>(args: Prisma.SelectSubset<T, CompanyUpsertArgs<ExtArgs>>): Prisma.Prisma__CompanyClient<runtime.Types.Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of Companies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompanyCountArgs} args - Arguments to filter Companies to count.
     * @example
     * // Count the number of Companies
     * const count = await prisma.company.count({
     *   where: {
     *     // ... the filter for the Companies we want to count
     *   }
     * })
    **/
    count<T extends CompanyCountArgs>(args?: Prisma.Subset<T, CompanyCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], CompanyCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a Company.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompanyAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CompanyAggregateArgs>(args: Prisma.Subset<T, CompanyAggregateArgs>): Prisma.PrismaPromise<GetCompanyAggregateType<T>>;
    /**
     * Group by Company.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompanyGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<T extends CompanyGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: CompanyGroupByArgs['orderBy'];
    } : {
        orderBy?: CompanyGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, CompanyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCompanyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Company model
     */
    readonly fields: CompanyFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for Company.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__CompanyClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    empenhos<T extends Prisma.Company$empenhosArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Company$empenhosArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$EmpenhoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    notasFicais<T extends Prisma.Company$notasFicaisArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Company$notasFicaisArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$NotaFiscalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
/**
 * Fields of the Company model
 */
export interface CompanyFieldRefs {
    readonly id: Prisma.FieldRef<"Company", 'String'>;
    readonly name: Prisma.FieldRef<"Company", 'String'>;
    readonly cnpj: Prisma.FieldRef<"Company", 'String'>;
    readonly cep: Prisma.FieldRef<"Company", 'String'>;
    readonly city: Prisma.FieldRef<"Company", 'String'>;
    readonly state: Prisma.FieldRef<"Company", 'String'>;
    readonly address: Prisma.FieldRef<"Company", 'String'>;
    readonly phone: Prisma.FieldRef<"Company", 'String'>;
    readonly email: Prisma.FieldRef<"Company", 'String'>;
    readonly hasActiveContract: Prisma.FieldRef<"Company", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"Company", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Company", 'DateTime'>;
}
/**
 * Company findUnique
 */
export type CompanyFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: Prisma.CompanySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Company
     */
    omit?: Prisma.CompanyOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CompanyInclude<ExtArgs> | null;
    /**
     * Filter, which Company to fetch.
     */
    where: Prisma.CompanyWhereUniqueInput;
};
/**
 * Company findUniqueOrThrow
 */
export type CompanyFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: Prisma.CompanySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Company
     */
    omit?: Prisma.CompanyOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CompanyInclude<ExtArgs> | null;
    /**
     * Filter, which Company to fetch.
     */
    where: Prisma.CompanyWhereUniqueInput;
};
/**
 * Company findFirst
 */
export type CompanyFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: Prisma.CompanySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Company
     */
    omit?: Prisma.CompanyOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CompanyInclude<ExtArgs> | null;
    /**
     * Filter, which Company to fetch.
     */
    where?: Prisma.CompanyWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Companies to fetch.
     */
    orderBy?: Prisma.CompanyOrderByWithRelationInput | Prisma.CompanyOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Companies.
     */
    cursor?: Prisma.CompanyWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Companies from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Companies.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Companies.
     */
    distinct?: Prisma.CompanyScalarFieldEnum | Prisma.CompanyScalarFieldEnum[];
};
/**
 * Company findFirstOrThrow
 */
export type CompanyFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: Prisma.CompanySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Company
     */
    omit?: Prisma.CompanyOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CompanyInclude<ExtArgs> | null;
    /**
     * Filter, which Company to fetch.
     */
    where?: Prisma.CompanyWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Companies to fetch.
     */
    orderBy?: Prisma.CompanyOrderByWithRelationInput | Prisma.CompanyOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Companies.
     */
    cursor?: Prisma.CompanyWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Companies from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Companies.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Companies.
     */
    distinct?: Prisma.CompanyScalarFieldEnum | Prisma.CompanyScalarFieldEnum[];
};
/**
 * Company findMany
 */
export type CompanyFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: Prisma.CompanySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Company
     */
    omit?: Prisma.CompanyOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CompanyInclude<ExtArgs> | null;
    /**
     * Filter, which Companies to fetch.
     */
    where?: Prisma.CompanyWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Companies to fetch.
     */
    orderBy?: Prisma.CompanyOrderByWithRelationInput | Prisma.CompanyOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Companies.
     */
    cursor?: Prisma.CompanyWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Companies from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Companies.
     */
    skip?: number;
    distinct?: Prisma.CompanyScalarFieldEnum | Prisma.CompanyScalarFieldEnum[];
};
/**
 * Company create
 */
export type CompanyCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: Prisma.CompanySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Company
     */
    omit?: Prisma.CompanyOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CompanyInclude<ExtArgs> | null;
    /**
     * The data needed to create a Company.
     */
    data: Prisma.XOR<Prisma.CompanyCreateInput, Prisma.CompanyUncheckedCreateInput>;
};
/**
 * Company createMany
 */
export type CompanyCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many Companies.
     */
    data: Prisma.CompanyCreateManyInput | Prisma.CompanyCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * Company createManyAndReturn
 */
export type CompanyCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: Prisma.CompanySelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Company
     */
    omit?: Prisma.CompanyOmit<ExtArgs> | null;
    /**
     * The data used to create many Companies.
     */
    data: Prisma.CompanyCreateManyInput | Prisma.CompanyCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * Company update
 */
export type CompanyUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: Prisma.CompanySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Company
     */
    omit?: Prisma.CompanyOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CompanyInclude<ExtArgs> | null;
    /**
     * The data needed to update a Company.
     */
    data: Prisma.XOR<Prisma.CompanyUpdateInput, Prisma.CompanyUncheckedUpdateInput>;
    /**
     * Choose, which Company to update.
     */
    where: Prisma.CompanyWhereUniqueInput;
};
/**
 * Company updateMany
 */
export type CompanyUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update Companies.
     */
    data: Prisma.XOR<Prisma.CompanyUpdateManyMutationInput, Prisma.CompanyUncheckedUpdateManyInput>;
    /**
     * Filter which Companies to update
     */
    where?: Prisma.CompanyWhereInput;
    /**
     * Limit how many Companies to update.
     */
    limit?: number;
};
/**
 * Company updateManyAndReturn
 */
export type CompanyUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: Prisma.CompanySelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Company
     */
    omit?: Prisma.CompanyOmit<ExtArgs> | null;
    /**
     * The data used to update Companies.
     */
    data: Prisma.XOR<Prisma.CompanyUpdateManyMutationInput, Prisma.CompanyUncheckedUpdateManyInput>;
    /**
     * Filter which Companies to update
     */
    where?: Prisma.CompanyWhereInput;
    /**
     * Limit how many Companies to update.
     */
    limit?: number;
};
/**
 * Company upsert
 */
export type CompanyUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: Prisma.CompanySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Company
     */
    omit?: Prisma.CompanyOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CompanyInclude<ExtArgs> | null;
    /**
     * The filter to search for the Company to update in case it exists.
     */
    where: Prisma.CompanyWhereUniqueInput;
    /**
     * In case the Company found by the `where` argument doesn't exist, create a new Company with this data.
     */
    create: Prisma.XOR<Prisma.CompanyCreateInput, Prisma.CompanyUncheckedCreateInput>;
    /**
     * In case the Company was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.CompanyUpdateInput, Prisma.CompanyUncheckedUpdateInput>;
};
/**
 * Company delete
 */
export type CompanyDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: Prisma.CompanySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Company
     */
    omit?: Prisma.CompanyOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CompanyInclude<ExtArgs> | null;
    /**
     * Filter which Company to delete.
     */
    where: Prisma.CompanyWhereUniqueInput;
};
/**
 * Company deleteMany
 */
export type CompanyDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Companies to delete
     */
    where?: Prisma.CompanyWhereInput;
    /**
     * Limit how many Companies to delete.
     */
    limit?: number;
};
/**
 * Company.empenhos
 */
export type Company$empenhosArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Empenho
     */
    select?: Prisma.EmpenhoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Empenho
     */
    omit?: Prisma.EmpenhoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.EmpenhoInclude<ExtArgs> | null;
    where?: Prisma.EmpenhoWhereInput;
    orderBy?: Prisma.EmpenhoOrderByWithRelationInput | Prisma.EmpenhoOrderByWithRelationInput[];
    cursor?: Prisma.EmpenhoWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.EmpenhoScalarFieldEnum | Prisma.EmpenhoScalarFieldEnum[];
};
/**
 * Company.notasFicais
 */
export type Company$notasFicaisArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotaFiscal
     */
    select?: Prisma.NotaFiscalSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the NotaFiscal
     */
    omit?: Prisma.NotaFiscalOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NotaFiscalInclude<ExtArgs> | null;
    where?: Prisma.NotaFiscalWhereInput;
    orderBy?: Prisma.NotaFiscalOrderByWithRelationInput | Prisma.NotaFiscalOrderByWithRelationInput[];
    cursor?: Prisma.NotaFiscalWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.NotaFiscalScalarFieldEnum | Prisma.NotaFiscalScalarFieldEnum[];
};
/**
 * Company without action
 */
export type CompanyDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Company
     */
    select?: Prisma.CompanySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Company
     */
    omit?: Prisma.CompanyOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CompanyInclude<ExtArgs> | null;
};
export {};
//# sourceMappingURL=Company.d.ts.map