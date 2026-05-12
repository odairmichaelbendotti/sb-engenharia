import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
/**
 * Model NotaFiscal
 *
 */
export type NotaFiscalModel = runtime.Types.Result.DefaultSelection<Prisma.$NotaFiscalPayload>;
export type AggregateNotaFiscal = {
    _count: NotaFiscalCountAggregateOutputType | null;
    _avg: NotaFiscalAvgAggregateOutputType | null;
    _sum: NotaFiscalSumAggregateOutputType | null;
    _min: NotaFiscalMinAggregateOutputType | null;
    _max: NotaFiscalMaxAggregateOutputType | null;
};
export type NotaFiscalAvgAggregateOutputType = {
    value: number | null;
};
export type NotaFiscalSumAggregateOutputType = {
    value: number | null;
};
export type NotaFiscalMinAggregateOutputType = {
    id: string | null;
    numero: string | null;
    description: string | null;
    vencimento: Date | null;
    value: number | null;
    status: $Enums.NotaFiscalStatus | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    empenho_id: string | null;
    company_id: string | null;
};
export type NotaFiscalMaxAggregateOutputType = {
    id: string | null;
    numero: string | null;
    description: string | null;
    vencimento: Date | null;
    value: number | null;
    status: $Enums.NotaFiscalStatus | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    empenho_id: string | null;
    company_id: string | null;
};
export type NotaFiscalCountAggregateOutputType = {
    id: number;
    numero: number;
    description: number;
    vencimento: number;
    value: number;
    status: number;
    createdAt: number;
    updatedAt: number;
    empenho_id: number;
    company_id: number;
    _all: number;
};
export type NotaFiscalAvgAggregateInputType = {
    value?: true;
};
export type NotaFiscalSumAggregateInputType = {
    value?: true;
};
export type NotaFiscalMinAggregateInputType = {
    id?: true;
    numero?: true;
    description?: true;
    vencimento?: true;
    value?: true;
    status?: true;
    createdAt?: true;
    updatedAt?: true;
    empenho_id?: true;
    company_id?: true;
};
export type NotaFiscalMaxAggregateInputType = {
    id?: true;
    numero?: true;
    description?: true;
    vencimento?: true;
    value?: true;
    status?: true;
    createdAt?: true;
    updatedAt?: true;
    empenho_id?: true;
    company_id?: true;
};
export type NotaFiscalCountAggregateInputType = {
    id?: true;
    numero?: true;
    description?: true;
    vencimento?: true;
    value?: true;
    status?: true;
    createdAt?: true;
    updatedAt?: true;
    empenho_id?: true;
    company_id?: true;
    _all?: true;
};
export type NotaFiscalAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which NotaFiscal to aggregate.
     */
    where?: Prisma.NotaFiscalWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of NotaFiscals to fetch.
     */
    orderBy?: Prisma.NotaFiscalOrderByWithRelationInput | Prisma.NotaFiscalOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.NotaFiscalWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` NotaFiscals from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` NotaFiscals.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned NotaFiscals
    **/
    _count?: true | NotaFiscalCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: NotaFiscalAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: NotaFiscalSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: NotaFiscalMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: NotaFiscalMaxAggregateInputType;
};
export type GetNotaFiscalAggregateType<T extends NotaFiscalAggregateArgs> = {
    [P in keyof T & keyof AggregateNotaFiscal]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateNotaFiscal[P]> : Prisma.GetScalarType<T[P], AggregateNotaFiscal[P]>;
};
export type NotaFiscalGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.NotaFiscalWhereInput;
    orderBy?: Prisma.NotaFiscalOrderByWithAggregationInput | Prisma.NotaFiscalOrderByWithAggregationInput[];
    by: Prisma.NotaFiscalScalarFieldEnum[] | Prisma.NotaFiscalScalarFieldEnum;
    having?: Prisma.NotaFiscalScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: NotaFiscalCountAggregateInputType | true;
    _avg?: NotaFiscalAvgAggregateInputType;
    _sum?: NotaFiscalSumAggregateInputType;
    _min?: NotaFiscalMinAggregateInputType;
    _max?: NotaFiscalMaxAggregateInputType;
};
export type NotaFiscalGroupByOutputType = {
    id: string;
    numero: string;
    description: string;
    vencimento: Date;
    value: number;
    status: $Enums.NotaFiscalStatus;
    createdAt: Date;
    updatedAt: Date;
    empenho_id: string;
    company_id: string;
    _count: NotaFiscalCountAggregateOutputType | null;
    _avg: NotaFiscalAvgAggregateOutputType | null;
    _sum: NotaFiscalSumAggregateOutputType | null;
    _min: NotaFiscalMinAggregateOutputType | null;
    _max: NotaFiscalMaxAggregateOutputType | null;
};
type GetNotaFiscalGroupByPayload<T extends NotaFiscalGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<NotaFiscalGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof NotaFiscalGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], NotaFiscalGroupByOutputType[P]> : Prisma.GetScalarType<T[P], NotaFiscalGroupByOutputType[P]>;
}>>;
export type NotaFiscalWhereInput = {
    AND?: Prisma.NotaFiscalWhereInput | Prisma.NotaFiscalWhereInput[];
    OR?: Prisma.NotaFiscalWhereInput[];
    NOT?: Prisma.NotaFiscalWhereInput | Prisma.NotaFiscalWhereInput[];
    id?: Prisma.StringFilter<"NotaFiscal"> | string;
    numero?: Prisma.StringFilter<"NotaFiscal"> | string;
    description?: Prisma.StringFilter<"NotaFiscal"> | string;
    vencimento?: Prisma.DateTimeFilter<"NotaFiscal"> | Date | string;
    value?: Prisma.IntFilter<"NotaFiscal"> | number;
    status?: Prisma.EnumNotaFiscalStatusFilter<"NotaFiscal"> | $Enums.NotaFiscalStatus;
    createdAt?: Prisma.DateTimeFilter<"NotaFiscal"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"NotaFiscal"> | Date | string;
    empenho_id?: Prisma.StringFilter<"NotaFiscal"> | string;
    company_id?: Prisma.StringFilter<"NotaFiscal"> | string;
    empenho?: Prisma.XOR<Prisma.EmpenhoScalarRelationFilter, Prisma.EmpenhoWhereInput>;
    company?: Prisma.XOR<Prisma.CompanyScalarRelationFilter, Prisma.CompanyWhereInput>;
};
export type NotaFiscalOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    numero?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    vencimento?: Prisma.SortOrder;
    value?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    empenho_id?: Prisma.SortOrder;
    company_id?: Prisma.SortOrder;
    empenho?: Prisma.EmpenhoOrderByWithRelationInput;
    company?: Prisma.CompanyOrderByWithRelationInput;
};
export type NotaFiscalWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.NotaFiscalWhereInput | Prisma.NotaFiscalWhereInput[];
    OR?: Prisma.NotaFiscalWhereInput[];
    NOT?: Prisma.NotaFiscalWhereInput | Prisma.NotaFiscalWhereInput[];
    numero?: Prisma.StringFilter<"NotaFiscal"> | string;
    description?: Prisma.StringFilter<"NotaFiscal"> | string;
    vencimento?: Prisma.DateTimeFilter<"NotaFiscal"> | Date | string;
    value?: Prisma.IntFilter<"NotaFiscal"> | number;
    status?: Prisma.EnumNotaFiscalStatusFilter<"NotaFiscal"> | $Enums.NotaFiscalStatus;
    createdAt?: Prisma.DateTimeFilter<"NotaFiscal"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"NotaFiscal"> | Date | string;
    empenho_id?: Prisma.StringFilter<"NotaFiscal"> | string;
    company_id?: Prisma.StringFilter<"NotaFiscal"> | string;
    empenho?: Prisma.XOR<Prisma.EmpenhoScalarRelationFilter, Prisma.EmpenhoWhereInput>;
    company?: Prisma.XOR<Prisma.CompanyScalarRelationFilter, Prisma.CompanyWhereInput>;
}, "id">;
export type NotaFiscalOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    numero?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    vencimento?: Prisma.SortOrder;
    value?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    empenho_id?: Prisma.SortOrder;
    company_id?: Prisma.SortOrder;
    _count?: Prisma.NotaFiscalCountOrderByAggregateInput;
    _avg?: Prisma.NotaFiscalAvgOrderByAggregateInput;
    _max?: Prisma.NotaFiscalMaxOrderByAggregateInput;
    _min?: Prisma.NotaFiscalMinOrderByAggregateInput;
    _sum?: Prisma.NotaFiscalSumOrderByAggregateInput;
};
export type NotaFiscalScalarWhereWithAggregatesInput = {
    AND?: Prisma.NotaFiscalScalarWhereWithAggregatesInput | Prisma.NotaFiscalScalarWhereWithAggregatesInput[];
    OR?: Prisma.NotaFiscalScalarWhereWithAggregatesInput[];
    NOT?: Prisma.NotaFiscalScalarWhereWithAggregatesInput | Prisma.NotaFiscalScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"NotaFiscal"> | string;
    numero?: Prisma.StringWithAggregatesFilter<"NotaFiscal"> | string;
    description?: Prisma.StringWithAggregatesFilter<"NotaFiscal"> | string;
    vencimento?: Prisma.DateTimeWithAggregatesFilter<"NotaFiscal"> | Date | string;
    value?: Prisma.IntWithAggregatesFilter<"NotaFiscal"> | number;
    status?: Prisma.EnumNotaFiscalStatusWithAggregatesFilter<"NotaFiscal"> | $Enums.NotaFiscalStatus;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"NotaFiscal"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"NotaFiscal"> | Date | string;
    empenho_id?: Prisma.StringWithAggregatesFilter<"NotaFiscal"> | string;
    company_id?: Prisma.StringWithAggregatesFilter<"NotaFiscal"> | string;
};
export type NotaFiscalCreateInput = {
    id?: string;
    numero: string;
    description: string;
    vencimento: Date | string;
    value: number;
    status?: $Enums.NotaFiscalStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    empenho: Prisma.EmpenhoCreateNestedOneWithoutNotaFiscalsInput;
    company: Prisma.CompanyCreateNestedOneWithoutNotasFicaisInput;
};
export type NotaFiscalUncheckedCreateInput = {
    id?: string;
    numero: string;
    description: string;
    vencimento: Date | string;
    value: number;
    status?: $Enums.NotaFiscalStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    empenho_id: string;
    company_id: string;
};
export type NotaFiscalUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    vencimento?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumNotaFiscalStatusFieldUpdateOperationsInput | $Enums.NotaFiscalStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    empenho?: Prisma.EmpenhoUpdateOneRequiredWithoutNotaFiscalsNestedInput;
    company?: Prisma.CompanyUpdateOneRequiredWithoutNotasFicaisNestedInput;
};
export type NotaFiscalUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    vencimento?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumNotaFiscalStatusFieldUpdateOperationsInput | $Enums.NotaFiscalStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    empenho_id?: Prisma.StringFieldUpdateOperationsInput | string;
    company_id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type NotaFiscalCreateManyInput = {
    id?: string;
    numero: string;
    description: string;
    vencimento: Date | string;
    value: number;
    status?: $Enums.NotaFiscalStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    empenho_id: string;
    company_id: string;
};
export type NotaFiscalUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    vencimento?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumNotaFiscalStatusFieldUpdateOperationsInput | $Enums.NotaFiscalStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NotaFiscalUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    vencimento?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumNotaFiscalStatusFieldUpdateOperationsInput | $Enums.NotaFiscalStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    empenho_id?: Prisma.StringFieldUpdateOperationsInput | string;
    company_id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type NotaFiscalListRelationFilter = {
    every?: Prisma.NotaFiscalWhereInput;
    some?: Prisma.NotaFiscalWhereInput;
    none?: Prisma.NotaFiscalWhereInput;
};
export type NotaFiscalOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type NotaFiscalCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    numero?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    vencimento?: Prisma.SortOrder;
    value?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    empenho_id?: Prisma.SortOrder;
    company_id?: Prisma.SortOrder;
};
export type NotaFiscalAvgOrderByAggregateInput = {
    value?: Prisma.SortOrder;
};
export type NotaFiscalMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    numero?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    vencimento?: Prisma.SortOrder;
    value?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    empenho_id?: Prisma.SortOrder;
    company_id?: Prisma.SortOrder;
};
export type NotaFiscalMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    numero?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    vencimento?: Prisma.SortOrder;
    value?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    empenho_id?: Prisma.SortOrder;
    company_id?: Prisma.SortOrder;
};
export type NotaFiscalSumOrderByAggregateInput = {
    value?: Prisma.SortOrder;
};
export type NotaFiscalCreateNestedManyWithoutCompanyInput = {
    create?: Prisma.XOR<Prisma.NotaFiscalCreateWithoutCompanyInput, Prisma.NotaFiscalUncheckedCreateWithoutCompanyInput> | Prisma.NotaFiscalCreateWithoutCompanyInput[] | Prisma.NotaFiscalUncheckedCreateWithoutCompanyInput[];
    connectOrCreate?: Prisma.NotaFiscalCreateOrConnectWithoutCompanyInput | Prisma.NotaFiscalCreateOrConnectWithoutCompanyInput[];
    createMany?: Prisma.NotaFiscalCreateManyCompanyInputEnvelope;
    connect?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
};
export type NotaFiscalUncheckedCreateNestedManyWithoutCompanyInput = {
    create?: Prisma.XOR<Prisma.NotaFiscalCreateWithoutCompanyInput, Prisma.NotaFiscalUncheckedCreateWithoutCompanyInput> | Prisma.NotaFiscalCreateWithoutCompanyInput[] | Prisma.NotaFiscalUncheckedCreateWithoutCompanyInput[];
    connectOrCreate?: Prisma.NotaFiscalCreateOrConnectWithoutCompanyInput | Prisma.NotaFiscalCreateOrConnectWithoutCompanyInput[];
    createMany?: Prisma.NotaFiscalCreateManyCompanyInputEnvelope;
    connect?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
};
export type NotaFiscalUpdateManyWithoutCompanyNestedInput = {
    create?: Prisma.XOR<Prisma.NotaFiscalCreateWithoutCompanyInput, Prisma.NotaFiscalUncheckedCreateWithoutCompanyInput> | Prisma.NotaFiscalCreateWithoutCompanyInput[] | Prisma.NotaFiscalUncheckedCreateWithoutCompanyInput[];
    connectOrCreate?: Prisma.NotaFiscalCreateOrConnectWithoutCompanyInput | Prisma.NotaFiscalCreateOrConnectWithoutCompanyInput[];
    upsert?: Prisma.NotaFiscalUpsertWithWhereUniqueWithoutCompanyInput | Prisma.NotaFiscalUpsertWithWhereUniqueWithoutCompanyInput[];
    createMany?: Prisma.NotaFiscalCreateManyCompanyInputEnvelope;
    set?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    disconnect?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    delete?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    connect?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    update?: Prisma.NotaFiscalUpdateWithWhereUniqueWithoutCompanyInput | Prisma.NotaFiscalUpdateWithWhereUniqueWithoutCompanyInput[];
    updateMany?: Prisma.NotaFiscalUpdateManyWithWhereWithoutCompanyInput | Prisma.NotaFiscalUpdateManyWithWhereWithoutCompanyInput[];
    deleteMany?: Prisma.NotaFiscalScalarWhereInput | Prisma.NotaFiscalScalarWhereInput[];
};
export type NotaFiscalUncheckedUpdateManyWithoutCompanyNestedInput = {
    create?: Prisma.XOR<Prisma.NotaFiscalCreateWithoutCompanyInput, Prisma.NotaFiscalUncheckedCreateWithoutCompanyInput> | Prisma.NotaFiscalCreateWithoutCompanyInput[] | Prisma.NotaFiscalUncheckedCreateWithoutCompanyInput[];
    connectOrCreate?: Prisma.NotaFiscalCreateOrConnectWithoutCompanyInput | Prisma.NotaFiscalCreateOrConnectWithoutCompanyInput[];
    upsert?: Prisma.NotaFiscalUpsertWithWhereUniqueWithoutCompanyInput | Prisma.NotaFiscalUpsertWithWhereUniqueWithoutCompanyInput[];
    createMany?: Prisma.NotaFiscalCreateManyCompanyInputEnvelope;
    set?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    disconnect?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    delete?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    connect?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    update?: Prisma.NotaFiscalUpdateWithWhereUniqueWithoutCompanyInput | Prisma.NotaFiscalUpdateWithWhereUniqueWithoutCompanyInput[];
    updateMany?: Prisma.NotaFiscalUpdateManyWithWhereWithoutCompanyInput | Prisma.NotaFiscalUpdateManyWithWhereWithoutCompanyInput[];
    deleteMany?: Prisma.NotaFiscalScalarWhereInput | Prisma.NotaFiscalScalarWhereInput[];
};
export type NotaFiscalCreateNestedManyWithoutEmpenhoInput = {
    create?: Prisma.XOR<Prisma.NotaFiscalCreateWithoutEmpenhoInput, Prisma.NotaFiscalUncheckedCreateWithoutEmpenhoInput> | Prisma.NotaFiscalCreateWithoutEmpenhoInput[] | Prisma.NotaFiscalUncheckedCreateWithoutEmpenhoInput[];
    connectOrCreate?: Prisma.NotaFiscalCreateOrConnectWithoutEmpenhoInput | Prisma.NotaFiscalCreateOrConnectWithoutEmpenhoInput[];
    createMany?: Prisma.NotaFiscalCreateManyEmpenhoInputEnvelope;
    connect?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
};
export type NotaFiscalUncheckedCreateNestedManyWithoutEmpenhoInput = {
    create?: Prisma.XOR<Prisma.NotaFiscalCreateWithoutEmpenhoInput, Prisma.NotaFiscalUncheckedCreateWithoutEmpenhoInput> | Prisma.NotaFiscalCreateWithoutEmpenhoInput[] | Prisma.NotaFiscalUncheckedCreateWithoutEmpenhoInput[];
    connectOrCreate?: Prisma.NotaFiscalCreateOrConnectWithoutEmpenhoInput | Prisma.NotaFiscalCreateOrConnectWithoutEmpenhoInput[];
    createMany?: Prisma.NotaFiscalCreateManyEmpenhoInputEnvelope;
    connect?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
};
export type NotaFiscalUpdateManyWithoutEmpenhoNestedInput = {
    create?: Prisma.XOR<Prisma.NotaFiscalCreateWithoutEmpenhoInput, Prisma.NotaFiscalUncheckedCreateWithoutEmpenhoInput> | Prisma.NotaFiscalCreateWithoutEmpenhoInput[] | Prisma.NotaFiscalUncheckedCreateWithoutEmpenhoInput[];
    connectOrCreate?: Prisma.NotaFiscalCreateOrConnectWithoutEmpenhoInput | Prisma.NotaFiscalCreateOrConnectWithoutEmpenhoInput[];
    upsert?: Prisma.NotaFiscalUpsertWithWhereUniqueWithoutEmpenhoInput | Prisma.NotaFiscalUpsertWithWhereUniqueWithoutEmpenhoInput[];
    createMany?: Prisma.NotaFiscalCreateManyEmpenhoInputEnvelope;
    set?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    disconnect?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    delete?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    connect?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    update?: Prisma.NotaFiscalUpdateWithWhereUniqueWithoutEmpenhoInput | Prisma.NotaFiscalUpdateWithWhereUniqueWithoutEmpenhoInput[];
    updateMany?: Prisma.NotaFiscalUpdateManyWithWhereWithoutEmpenhoInput | Prisma.NotaFiscalUpdateManyWithWhereWithoutEmpenhoInput[];
    deleteMany?: Prisma.NotaFiscalScalarWhereInput | Prisma.NotaFiscalScalarWhereInput[];
};
export type NotaFiscalUncheckedUpdateManyWithoutEmpenhoNestedInput = {
    create?: Prisma.XOR<Prisma.NotaFiscalCreateWithoutEmpenhoInput, Prisma.NotaFiscalUncheckedCreateWithoutEmpenhoInput> | Prisma.NotaFiscalCreateWithoutEmpenhoInput[] | Prisma.NotaFiscalUncheckedCreateWithoutEmpenhoInput[];
    connectOrCreate?: Prisma.NotaFiscalCreateOrConnectWithoutEmpenhoInput | Prisma.NotaFiscalCreateOrConnectWithoutEmpenhoInput[];
    upsert?: Prisma.NotaFiscalUpsertWithWhereUniqueWithoutEmpenhoInput | Prisma.NotaFiscalUpsertWithWhereUniqueWithoutEmpenhoInput[];
    createMany?: Prisma.NotaFiscalCreateManyEmpenhoInputEnvelope;
    set?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    disconnect?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    delete?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    connect?: Prisma.NotaFiscalWhereUniqueInput | Prisma.NotaFiscalWhereUniqueInput[];
    update?: Prisma.NotaFiscalUpdateWithWhereUniqueWithoutEmpenhoInput | Prisma.NotaFiscalUpdateWithWhereUniqueWithoutEmpenhoInput[];
    updateMany?: Prisma.NotaFiscalUpdateManyWithWhereWithoutEmpenhoInput | Prisma.NotaFiscalUpdateManyWithWhereWithoutEmpenhoInput[];
    deleteMany?: Prisma.NotaFiscalScalarWhereInput | Prisma.NotaFiscalScalarWhereInput[];
};
export type EnumNotaFiscalStatusFieldUpdateOperationsInput = {
    set?: $Enums.NotaFiscalStatus;
};
export type NotaFiscalCreateWithoutCompanyInput = {
    id?: string;
    numero: string;
    description: string;
    vencimento: Date | string;
    value: number;
    status?: $Enums.NotaFiscalStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    empenho: Prisma.EmpenhoCreateNestedOneWithoutNotaFiscalsInput;
};
export type NotaFiscalUncheckedCreateWithoutCompanyInput = {
    id?: string;
    numero: string;
    description: string;
    vencimento: Date | string;
    value: number;
    status?: $Enums.NotaFiscalStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    empenho_id: string;
};
export type NotaFiscalCreateOrConnectWithoutCompanyInput = {
    where: Prisma.NotaFiscalWhereUniqueInput;
    create: Prisma.XOR<Prisma.NotaFiscalCreateWithoutCompanyInput, Prisma.NotaFiscalUncheckedCreateWithoutCompanyInput>;
};
export type NotaFiscalCreateManyCompanyInputEnvelope = {
    data: Prisma.NotaFiscalCreateManyCompanyInput | Prisma.NotaFiscalCreateManyCompanyInput[];
    skipDuplicates?: boolean;
};
export type NotaFiscalUpsertWithWhereUniqueWithoutCompanyInput = {
    where: Prisma.NotaFiscalWhereUniqueInput;
    update: Prisma.XOR<Prisma.NotaFiscalUpdateWithoutCompanyInput, Prisma.NotaFiscalUncheckedUpdateWithoutCompanyInput>;
    create: Prisma.XOR<Prisma.NotaFiscalCreateWithoutCompanyInput, Prisma.NotaFiscalUncheckedCreateWithoutCompanyInput>;
};
export type NotaFiscalUpdateWithWhereUniqueWithoutCompanyInput = {
    where: Prisma.NotaFiscalWhereUniqueInput;
    data: Prisma.XOR<Prisma.NotaFiscalUpdateWithoutCompanyInput, Prisma.NotaFiscalUncheckedUpdateWithoutCompanyInput>;
};
export type NotaFiscalUpdateManyWithWhereWithoutCompanyInput = {
    where: Prisma.NotaFiscalScalarWhereInput;
    data: Prisma.XOR<Prisma.NotaFiscalUpdateManyMutationInput, Prisma.NotaFiscalUncheckedUpdateManyWithoutCompanyInput>;
};
export type NotaFiscalScalarWhereInput = {
    AND?: Prisma.NotaFiscalScalarWhereInput | Prisma.NotaFiscalScalarWhereInput[];
    OR?: Prisma.NotaFiscalScalarWhereInput[];
    NOT?: Prisma.NotaFiscalScalarWhereInput | Prisma.NotaFiscalScalarWhereInput[];
    id?: Prisma.StringFilter<"NotaFiscal"> | string;
    numero?: Prisma.StringFilter<"NotaFiscal"> | string;
    description?: Prisma.StringFilter<"NotaFiscal"> | string;
    vencimento?: Prisma.DateTimeFilter<"NotaFiscal"> | Date | string;
    value?: Prisma.IntFilter<"NotaFiscal"> | number;
    status?: Prisma.EnumNotaFiscalStatusFilter<"NotaFiscal"> | $Enums.NotaFiscalStatus;
    createdAt?: Prisma.DateTimeFilter<"NotaFiscal"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"NotaFiscal"> | Date | string;
    empenho_id?: Prisma.StringFilter<"NotaFiscal"> | string;
    company_id?: Prisma.StringFilter<"NotaFiscal"> | string;
};
export type NotaFiscalCreateWithoutEmpenhoInput = {
    id?: string;
    numero: string;
    description: string;
    vencimento: Date | string;
    value: number;
    status?: $Enums.NotaFiscalStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    company: Prisma.CompanyCreateNestedOneWithoutNotasFicaisInput;
};
export type NotaFiscalUncheckedCreateWithoutEmpenhoInput = {
    id?: string;
    numero: string;
    description: string;
    vencimento: Date | string;
    value: number;
    status?: $Enums.NotaFiscalStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    company_id: string;
};
export type NotaFiscalCreateOrConnectWithoutEmpenhoInput = {
    where: Prisma.NotaFiscalWhereUniqueInput;
    create: Prisma.XOR<Prisma.NotaFiscalCreateWithoutEmpenhoInput, Prisma.NotaFiscalUncheckedCreateWithoutEmpenhoInput>;
};
export type NotaFiscalCreateManyEmpenhoInputEnvelope = {
    data: Prisma.NotaFiscalCreateManyEmpenhoInput | Prisma.NotaFiscalCreateManyEmpenhoInput[];
    skipDuplicates?: boolean;
};
export type NotaFiscalUpsertWithWhereUniqueWithoutEmpenhoInput = {
    where: Prisma.NotaFiscalWhereUniqueInput;
    update: Prisma.XOR<Prisma.NotaFiscalUpdateWithoutEmpenhoInput, Prisma.NotaFiscalUncheckedUpdateWithoutEmpenhoInput>;
    create: Prisma.XOR<Prisma.NotaFiscalCreateWithoutEmpenhoInput, Prisma.NotaFiscalUncheckedCreateWithoutEmpenhoInput>;
};
export type NotaFiscalUpdateWithWhereUniqueWithoutEmpenhoInput = {
    where: Prisma.NotaFiscalWhereUniqueInput;
    data: Prisma.XOR<Prisma.NotaFiscalUpdateWithoutEmpenhoInput, Prisma.NotaFiscalUncheckedUpdateWithoutEmpenhoInput>;
};
export type NotaFiscalUpdateManyWithWhereWithoutEmpenhoInput = {
    where: Prisma.NotaFiscalScalarWhereInput;
    data: Prisma.XOR<Prisma.NotaFiscalUpdateManyMutationInput, Prisma.NotaFiscalUncheckedUpdateManyWithoutEmpenhoInput>;
};
export type NotaFiscalCreateManyCompanyInput = {
    id?: string;
    numero: string;
    description: string;
    vencimento: Date | string;
    value: number;
    status?: $Enums.NotaFiscalStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    empenho_id: string;
};
export type NotaFiscalUpdateWithoutCompanyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    vencimento?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumNotaFiscalStatusFieldUpdateOperationsInput | $Enums.NotaFiscalStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    empenho?: Prisma.EmpenhoUpdateOneRequiredWithoutNotaFiscalsNestedInput;
};
export type NotaFiscalUncheckedUpdateWithoutCompanyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    vencimento?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumNotaFiscalStatusFieldUpdateOperationsInput | $Enums.NotaFiscalStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    empenho_id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type NotaFiscalUncheckedUpdateManyWithoutCompanyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    vencimento?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumNotaFiscalStatusFieldUpdateOperationsInput | $Enums.NotaFiscalStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    empenho_id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type NotaFiscalCreateManyEmpenhoInput = {
    id?: string;
    numero: string;
    description: string;
    vencimento: Date | string;
    value: number;
    status?: $Enums.NotaFiscalStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    company_id: string;
};
export type NotaFiscalUpdateWithoutEmpenhoInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    vencimento?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumNotaFiscalStatusFieldUpdateOperationsInput | $Enums.NotaFiscalStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    company?: Prisma.CompanyUpdateOneRequiredWithoutNotasFicaisNestedInput;
};
export type NotaFiscalUncheckedUpdateWithoutEmpenhoInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    vencimento?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumNotaFiscalStatusFieldUpdateOperationsInput | $Enums.NotaFiscalStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    company_id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type NotaFiscalUncheckedUpdateManyWithoutEmpenhoInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    vencimento?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumNotaFiscalStatusFieldUpdateOperationsInput | $Enums.NotaFiscalStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    company_id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type NotaFiscalSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    numero?: boolean;
    description?: boolean;
    vencimento?: boolean;
    value?: boolean;
    status?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    empenho_id?: boolean;
    company_id?: boolean;
    empenho?: boolean | Prisma.EmpenhoDefaultArgs<ExtArgs>;
    company?: boolean | Prisma.CompanyDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["notaFiscal"]>;
export type NotaFiscalSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    numero?: boolean;
    description?: boolean;
    vencimento?: boolean;
    value?: boolean;
    status?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    empenho_id?: boolean;
    company_id?: boolean;
    empenho?: boolean | Prisma.EmpenhoDefaultArgs<ExtArgs>;
    company?: boolean | Prisma.CompanyDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["notaFiscal"]>;
export type NotaFiscalSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    numero?: boolean;
    description?: boolean;
    vencimento?: boolean;
    value?: boolean;
    status?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    empenho_id?: boolean;
    company_id?: boolean;
    empenho?: boolean | Prisma.EmpenhoDefaultArgs<ExtArgs>;
    company?: boolean | Prisma.CompanyDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["notaFiscal"]>;
export type NotaFiscalSelectScalar = {
    id?: boolean;
    numero?: boolean;
    description?: boolean;
    vencimento?: boolean;
    value?: boolean;
    status?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    empenho_id?: boolean;
    company_id?: boolean;
};
export type NotaFiscalOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "numero" | "description" | "vencimento" | "value" | "status" | "createdAt" | "updatedAt" | "empenho_id" | "company_id", ExtArgs["result"]["notaFiscal"]>;
export type NotaFiscalInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    empenho?: boolean | Prisma.EmpenhoDefaultArgs<ExtArgs>;
    company?: boolean | Prisma.CompanyDefaultArgs<ExtArgs>;
};
export type NotaFiscalIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    empenho?: boolean | Prisma.EmpenhoDefaultArgs<ExtArgs>;
    company?: boolean | Prisma.CompanyDefaultArgs<ExtArgs>;
};
export type NotaFiscalIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    empenho?: boolean | Prisma.EmpenhoDefaultArgs<ExtArgs>;
    company?: boolean | Prisma.CompanyDefaultArgs<ExtArgs>;
};
export type $NotaFiscalPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "NotaFiscal";
    objects: {
        empenho: Prisma.$EmpenhoPayload<ExtArgs>;
        company: Prisma.$CompanyPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        numero: string;
        description: string;
        vencimento: Date;
        value: number;
        status: $Enums.NotaFiscalStatus;
        createdAt: Date;
        updatedAt: Date;
        empenho_id: string;
        company_id: string;
    }, ExtArgs["result"]["notaFiscal"]>;
    composites: {};
};
export type NotaFiscalGetPayload<S extends boolean | null | undefined | NotaFiscalDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$NotaFiscalPayload, S>;
export type NotaFiscalCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<NotaFiscalFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: NotaFiscalCountAggregateInputType | true;
};
export interface NotaFiscalDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['NotaFiscal'];
        meta: {
            name: 'NotaFiscal';
        };
    };
    /**
     * Find zero or one NotaFiscal that matches the filter.
     * @param {NotaFiscalFindUniqueArgs} args - Arguments to find a NotaFiscal
     * @example
     * // Get one NotaFiscal
     * const notaFiscal = await prisma.notaFiscal.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NotaFiscalFindUniqueArgs>(args: Prisma.SelectSubset<T, NotaFiscalFindUniqueArgs<ExtArgs>>): Prisma.Prisma__NotaFiscalClient<runtime.Types.Result.GetResult<Prisma.$NotaFiscalPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one NotaFiscal that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NotaFiscalFindUniqueOrThrowArgs} args - Arguments to find a NotaFiscal
     * @example
     * // Get one NotaFiscal
     * const notaFiscal = await prisma.notaFiscal.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NotaFiscalFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, NotaFiscalFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__NotaFiscalClient<runtime.Types.Result.GetResult<Prisma.$NotaFiscalPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first NotaFiscal that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotaFiscalFindFirstArgs} args - Arguments to find a NotaFiscal
     * @example
     * // Get one NotaFiscal
     * const notaFiscal = await prisma.notaFiscal.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NotaFiscalFindFirstArgs>(args?: Prisma.SelectSubset<T, NotaFiscalFindFirstArgs<ExtArgs>>): Prisma.Prisma__NotaFiscalClient<runtime.Types.Result.GetResult<Prisma.$NotaFiscalPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first NotaFiscal that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotaFiscalFindFirstOrThrowArgs} args - Arguments to find a NotaFiscal
     * @example
     * // Get one NotaFiscal
     * const notaFiscal = await prisma.notaFiscal.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NotaFiscalFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, NotaFiscalFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__NotaFiscalClient<runtime.Types.Result.GetResult<Prisma.$NotaFiscalPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more NotaFiscals that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotaFiscalFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all NotaFiscals
     * const notaFiscals = await prisma.notaFiscal.findMany()
     *
     * // Get first 10 NotaFiscals
     * const notaFiscals = await prisma.notaFiscal.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const notaFiscalWithIdOnly = await prisma.notaFiscal.findMany({ select: { id: true } })
     *
     */
    findMany<T extends NotaFiscalFindManyArgs>(args?: Prisma.SelectSubset<T, NotaFiscalFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$NotaFiscalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a NotaFiscal.
     * @param {NotaFiscalCreateArgs} args - Arguments to create a NotaFiscal.
     * @example
     * // Create one NotaFiscal
     * const NotaFiscal = await prisma.notaFiscal.create({
     *   data: {
     *     // ... data to create a NotaFiscal
     *   }
     * })
     *
     */
    create<T extends NotaFiscalCreateArgs>(args: Prisma.SelectSubset<T, NotaFiscalCreateArgs<ExtArgs>>): Prisma.Prisma__NotaFiscalClient<runtime.Types.Result.GetResult<Prisma.$NotaFiscalPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many NotaFiscals.
     * @param {NotaFiscalCreateManyArgs} args - Arguments to create many NotaFiscals.
     * @example
     * // Create many NotaFiscals
     * const notaFiscal = await prisma.notaFiscal.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends NotaFiscalCreateManyArgs>(args?: Prisma.SelectSubset<T, NotaFiscalCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many NotaFiscals and returns the data saved in the database.
     * @param {NotaFiscalCreateManyAndReturnArgs} args - Arguments to create many NotaFiscals.
     * @example
     * // Create many NotaFiscals
     * const notaFiscal = await prisma.notaFiscal.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many NotaFiscals and only return the `id`
     * const notaFiscalWithIdOnly = await prisma.notaFiscal.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends NotaFiscalCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, NotaFiscalCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$NotaFiscalPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a NotaFiscal.
     * @param {NotaFiscalDeleteArgs} args - Arguments to delete one NotaFiscal.
     * @example
     * // Delete one NotaFiscal
     * const NotaFiscal = await prisma.notaFiscal.delete({
     *   where: {
     *     // ... filter to delete one NotaFiscal
     *   }
     * })
     *
     */
    delete<T extends NotaFiscalDeleteArgs>(args: Prisma.SelectSubset<T, NotaFiscalDeleteArgs<ExtArgs>>): Prisma.Prisma__NotaFiscalClient<runtime.Types.Result.GetResult<Prisma.$NotaFiscalPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one NotaFiscal.
     * @param {NotaFiscalUpdateArgs} args - Arguments to update one NotaFiscal.
     * @example
     * // Update one NotaFiscal
     * const notaFiscal = await prisma.notaFiscal.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends NotaFiscalUpdateArgs>(args: Prisma.SelectSubset<T, NotaFiscalUpdateArgs<ExtArgs>>): Prisma.Prisma__NotaFiscalClient<runtime.Types.Result.GetResult<Prisma.$NotaFiscalPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more NotaFiscals.
     * @param {NotaFiscalDeleteManyArgs} args - Arguments to filter NotaFiscals to delete.
     * @example
     * // Delete a few NotaFiscals
     * const { count } = await prisma.notaFiscal.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends NotaFiscalDeleteManyArgs>(args?: Prisma.SelectSubset<T, NotaFiscalDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more NotaFiscals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotaFiscalUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many NotaFiscals
     * const notaFiscal = await prisma.notaFiscal.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends NotaFiscalUpdateManyArgs>(args: Prisma.SelectSubset<T, NotaFiscalUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more NotaFiscals and returns the data updated in the database.
     * @param {NotaFiscalUpdateManyAndReturnArgs} args - Arguments to update many NotaFiscals.
     * @example
     * // Update many NotaFiscals
     * const notaFiscal = await prisma.notaFiscal.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more NotaFiscals and only return the `id`
     * const notaFiscalWithIdOnly = await prisma.notaFiscal.updateManyAndReturn({
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
    updateManyAndReturn<T extends NotaFiscalUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, NotaFiscalUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$NotaFiscalPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one NotaFiscal.
     * @param {NotaFiscalUpsertArgs} args - Arguments to update or create a NotaFiscal.
     * @example
     * // Update or create a NotaFiscal
     * const notaFiscal = await prisma.notaFiscal.upsert({
     *   create: {
     *     // ... data to create a NotaFiscal
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the NotaFiscal we want to update
     *   }
     * })
     */
    upsert<T extends NotaFiscalUpsertArgs>(args: Prisma.SelectSubset<T, NotaFiscalUpsertArgs<ExtArgs>>): Prisma.Prisma__NotaFiscalClient<runtime.Types.Result.GetResult<Prisma.$NotaFiscalPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of NotaFiscals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotaFiscalCountArgs} args - Arguments to filter NotaFiscals to count.
     * @example
     * // Count the number of NotaFiscals
     * const count = await prisma.notaFiscal.count({
     *   where: {
     *     // ... the filter for the NotaFiscals we want to count
     *   }
     * })
    **/
    count<T extends NotaFiscalCountArgs>(args?: Prisma.Subset<T, NotaFiscalCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], NotaFiscalCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a NotaFiscal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotaFiscalAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends NotaFiscalAggregateArgs>(args: Prisma.Subset<T, NotaFiscalAggregateArgs>): Prisma.PrismaPromise<GetNotaFiscalAggregateType<T>>;
    /**
     * Group by NotaFiscal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotaFiscalGroupByArgs} args - Group by arguments.
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
    groupBy<T extends NotaFiscalGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: NotaFiscalGroupByArgs['orderBy'];
    } : {
        orderBy?: NotaFiscalGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, NotaFiscalGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotaFiscalGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the NotaFiscal model
     */
    readonly fields: NotaFiscalFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for NotaFiscal.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__NotaFiscalClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    empenho<T extends Prisma.EmpenhoDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.EmpenhoDefaultArgs<ExtArgs>>): Prisma.Prisma__EmpenhoClient<runtime.Types.Result.GetResult<Prisma.$EmpenhoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    company<T extends Prisma.CompanyDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.CompanyDefaultArgs<ExtArgs>>): Prisma.Prisma__CompanyClient<runtime.Types.Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
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
 * Fields of the NotaFiscal model
 */
export interface NotaFiscalFieldRefs {
    readonly id: Prisma.FieldRef<"NotaFiscal", 'String'>;
    readonly numero: Prisma.FieldRef<"NotaFiscal", 'String'>;
    readonly description: Prisma.FieldRef<"NotaFiscal", 'String'>;
    readonly vencimento: Prisma.FieldRef<"NotaFiscal", 'DateTime'>;
    readonly value: Prisma.FieldRef<"NotaFiscal", 'Int'>;
    readonly status: Prisma.FieldRef<"NotaFiscal", 'NotaFiscalStatus'>;
    readonly createdAt: Prisma.FieldRef<"NotaFiscal", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"NotaFiscal", 'DateTime'>;
    readonly empenho_id: Prisma.FieldRef<"NotaFiscal", 'String'>;
    readonly company_id: Prisma.FieldRef<"NotaFiscal", 'String'>;
}
/**
 * NotaFiscal findUnique
 */
export type NotaFiscalFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which NotaFiscal to fetch.
     */
    where: Prisma.NotaFiscalWhereUniqueInput;
};
/**
 * NotaFiscal findUniqueOrThrow
 */
export type NotaFiscalFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which NotaFiscal to fetch.
     */
    where: Prisma.NotaFiscalWhereUniqueInput;
};
/**
 * NotaFiscal findFirst
 */
export type NotaFiscalFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which NotaFiscal to fetch.
     */
    where?: Prisma.NotaFiscalWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of NotaFiscals to fetch.
     */
    orderBy?: Prisma.NotaFiscalOrderByWithRelationInput | Prisma.NotaFiscalOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for NotaFiscals.
     */
    cursor?: Prisma.NotaFiscalWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` NotaFiscals from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` NotaFiscals.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of NotaFiscals.
     */
    distinct?: Prisma.NotaFiscalScalarFieldEnum | Prisma.NotaFiscalScalarFieldEnum[];
};
/**
 * NotaFiscal findFirstOrThrow
 */
export type NotaFiscalFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which NotaFiscal to fetch.
     */
    where?: Prisma.NotaFiscalWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of NotaFiscals to fetch.
     */
    orderBy?: Prisma.NotaFiscalOrderByWithRelationInput | Prisma.NotaFiscalOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for NotaFiscals.
     */
    cursor?: Prisma.NotaFiscalWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` NotaFiscals from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` NotaFiscals.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of NotaFiscals.
     */
    distinct?: Prisma.NotaFiscalScalarFieldEnum | Prisma.NotaFiscalScalarFieldEnum[];
};
/**
 * NotaFiscal findMany
 */
export type NotaFiscalFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which NotaFiscals to fetch.
     */
    where?: Prisma.NotaFiscalWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of NotaFiscals to fetch.
     */
    orderBy?: Prisma.NotaFiscalOrderByWithRelationInput | Prisma.NotaFiscalOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing NotaFiscals.
     */
    cursor?: Prisma.NotaFiscalWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` NotaFiscals from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` NotaFiscals.
     */
    skip?: number;
    distinct?: Prisma.NotaFiscalScalarFieldEnum | Prisma.NotaFiscalScalarFieldEnum[];
};
/**
 * NotaFiscal create
 */
export type NotaFiscalCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * The data needed to create a NotaFiscal.
     */
    data: Prisma.XOR<Prisma.NotaFiscalCreateInput, Prisma.NotaFiscalUncheckedCreateInput>;
};
/**
 * NotaFiscal createMany
 */
export type NotaFiscalCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many NotaFiscals.
     */
    data: Prisma.NotaFiscalCreateManyInput | Prisma.NotaFiscalCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * NotaFiscal createManyAndReturn
 */
export type NotaFiscalCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotaFiscal
     */
    select?: Prisma.NotaFiscalSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the NotaFiscal
     */
    omit?: Prisma.NotaFiscalOmit<ExtArgs> | null;
    /**
     * The data used to create many NotaFiscals.
     */
    data: Prisma.NotaFiscalCreateManyInput | Prisma.NotaFiscalCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NotaFiscalIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * NotaFiscal update
 */
export type NotaFiscalUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * The data needed to update a NotaFiscal.
     */
    data: Prisma.XOR<Prisma.NotaFiscalUpdateInput, Prisma.NotaFiscalUncheckedUpdateInput>;
    /**
     * Choose, which NotaFiscal to update.
     */
    where: Prisma.NotaFiscalWhereUniqueInput;
};
/**
 * NotaFiscal updateMany
 */
export type NotaFiscalUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update NotaFiscals.
     */
    data: Prisma.XOR<Prisma.NotaFiscalUpdateManyMutationInput, Prisma.NotaFiscalUncheckedUpdateManyInput>;
    /**
     * Filter which NotaFiscals to update
     */
    where?: Prisma.NotaFiscalWhereInput;
    /**
     * Limit how many NotaFiscals to update.
     */
    limit?: number;
};
/**
 * NotaFiscal updateManyAndReturn
 */
export type NotaFiscalUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotaFiscal
     */
    select?: Prisma.NotaFiscalSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the NotaFiscal
     */
    omit?: Prisma.NotaFiscalOmit<ExtArgs> | null;
    /**
     * The data used to update NotaFiscals.
     */
    data: Prisma.XOR<Prisma.NotaFiscalUpdateManyMutationInput, Prisma.NotaFiscalUncheckedUpdateManyInput>;
    /**
     * Filter which NotaFiscals to update
     */
    where?: Prisma.NotaFiscalWhereInput;
    /**
     * Limit how many NotaFiscals to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NotaFiscalIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * NotaFiscal upsert
 */
export type NotaFiscalUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * The filter to search for the NotaFiscal to update in case it exists.
     */
    where: Prisma.NotaFiscalWhereUniqueInput;
    /**
     * In case the NotaFiscal found by the `where` argument doesn't exist, create a new NotaFiscal with this data.
     */
    create: Prisma.XOR<Prisma.NotaFiscalCreateInput, Prisma.NotaFiscalUncheckedCreateInput>;
    /**
     * In case the NotaFiscal was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.NotaFiscalUpdateInput, Prisma.NotaFiscalUncheckedUpdateInput>;
};
/**
 * NotaFiscal delete
 */
export type NotaFiscalDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter which NotaFiscal to delete.
     */
    where: Prisma.NotaFiscalWhereUniqueInput;
};
/**
 * NotaFiscal deleteMany
 */
export type NotaFiscalDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which NotaFiscals to delete
     */
    where?: Prisma.NotaFiscalWhereInput;
    /**
     * Limit how many NotaFiscals to delete.
     */
    limit?: number;
};
/**
 * NotaFiscal without action
 */
export type NotaFiscalDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
};
export {};
//# sourceMappingURL=NotaFiscal.d.ts.map