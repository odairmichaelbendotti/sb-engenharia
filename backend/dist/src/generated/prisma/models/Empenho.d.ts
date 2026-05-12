import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
/**
 * Model Empenho
 *
 */
export type EmpenhoModel = runtime.Types.Result.DefaultSelection<Prisma.$EmpenhoPayload>;
export type AggregateEmpenho = {
    _count: EmpenhoCountAggregateOutputType | null;
    _avg: EmpenhoAvgAggregateOutputType | null;
    _sum: EmpenhoSumAggregateOutputType | null;
    _min: EmpenhoMinAggregateOutputType | null;
    _max: EmpenhoMaxAggregateOutputType | null;
};
export type EmpenhoAvgAggregateOutputType = {
    value: number | null;
    totalPaid: number | null;
};
export type EmpenhoSumAggregateOutputType = {
    value: number | null;
    totalPaid: number | null;
};
export type EmpenhoMinAggregateOutputType = {
    id: string | null;
    numero: string | null;
    description: string | null;
    startAt: Date | null;
    endAt: Date | null;
    value: number | null;
    totalPaid: number | null;
    status: $Enums.EmpenhoStatus | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    company_id: string | null;
};
export type EmpenhoMaxAggregateOutputType = {
    id: string | null;
    numero: string | null;
    description: string | null;
    startAt: Date | null;
    endAt: Date | null;
    value: number | null;
    totalPaid: number | null;
    status: $Enums.EmpenhoStatus | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    company_id: string | null;
};
export type EmpenhoCountAggregateOutputType = {
    id: number;
    numero: number;
    description: number;
    startAt: number;
    endAt: number;
    value: number;
    totalPaid: number;
    status: number;
    createdAt: number;
    updatedAt: number;
    company_id: number;
    _all: number;
};
export type EmpenhoAvgAggregateInputType = {
    value?: true;
    totalPaid?: true;
};
export type EmpenhoSumAggregateInputType = {
    value?: true;
    totalPaid?: true;
};
export type EmpenhoMinAggregateInputType = {
    id?: true;
    numero?: true;
    description?: true;
    startAt?: true;
    endAt?: true;
    value?: true;
    totalPaid?: true;
    status?: true;
    createdAt?: true;
    updatedAt?: true;
    company_id?: true;
};
export type EmpenhoMaxAggregateInputType = {
    id?: true;
    numero?: true;
    description?: true;
    startAt?: true;
    endAt?: true;
    value?: true;
    totalPaid?: true;
    status?: true;
    createdAt?: true;
    updatedAt?: true;
    company_id?: true;
};
export type EmpenhoCountAggregateInputType = {
    id?: true;
    numero?: true;
    description?: true;
    startAt?: true;
    endAt?: true;
    value?: true;
    totalPaid?: true;
    status?: true;
    createdAt?: true;
    updatedAt?: true;
    company_id?: true;
    _all?: true;
};
export type EmpenhoAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Empenho to aggregate.
     */
    where?: Prisma.EmpenhoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Empenhos to fetch.
     */
    orderBy?: Prisma.EmpenhoOrderByWithRelationInput | Prisma.EmpenhoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.EmpenhoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Empenhos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Empenhos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Empenhos
    **/
    _count?: true | EmpenhoCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: EmpenhoAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: EmpenhoSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: EmpenhoMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: EmpenhoMaxAggregateInputType;
};
export type GetEmpenhoAggregateType<T extends EmpenhoAggregateArgs> = {
    [P in keyof T & keyof AggregateEmpenho]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateEmpenho[P]> : Prisma.GetScalarType<T[P], AggregateEmpenho[P]>;
};
export type EmpenhoGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.EmpenhoWhereInput;
    orderBy?: Prisma.EmpenhoOrderByWithAggregationInput | Prisma.EmpenhoOrderByWithAggregationInput[];
    by: Prisma.EmpenhoScalarFieldEnum[] | Prisma.EmpenhoScalarFieldEnum;
    having?: Prisma.EmpenhoScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: EmpenhoCountAggregateInputType | true;
    _avg?: EmpenhoAvgAggregateInputType;
    _sum?: EmpenhoSumAggregateInputType;
    _min?: EmpenhoMinAggregateInputType;
    _max?: EmpenhoMaxAggregateInputType;
};
export type EmpenhoGroupByOutputType = {
    id: string;
    numero: string;
    description: string;
    startAt: Date;
    endAt: Date;
    value: number;
    totalPaid: number;
    status: $Enums.EmpenhoStatus;
    createdAt: Date;
    updatedAt: Date;
    company_id: string;
    _count: EmpenhoCountAggregateOutputType | null;
    _avg: EmpenhoAvgAggregateOutputType | null;
    _sum: EmpenhoSumAggregateOutputType | null;
    _min: EmpenhoMinAggregateOutputType | null;
    _max: EmpenhoMaxAggregateOutputType | null;
};
type GetEmpenhoGroupByPayload<T extends EmpenhoGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<EmpenhoGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof EmpenhoGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], EmpenhoGroupByOutputType[P]> : Prisma.GetScalarType<T[P], EmpenhoGroupByOutputType[P]>;
}>>;
export type EmpenhoWhereInput = {
    AND?: Prisma.EmpenhoWhereInput | Prisma.EmpenhoWhereInput[];
    OR?: Prisma.EmpenhoWhereInput[];
    NOT?: Prisma.EmpenhoWhereInput | Prisma.EmpenhoWhereInput[];
    id?: Prisma.StringFilter<"Empenho"> | string;
    numero?: Prisma.StringFilter<"Empenho"> | string;
    description?: Prisma.StringFilter<"Empenho"> | string;
    startAt?: Prisma.DateTimeFilter<"Empenho"> | Date | string;
    endAt?: Prisma.DateTimeFilter<"Empenho"> | Date | string;
    value?: Prisma.IntFilter<"Empenho"> | number;
    totalPaid?: Prisma.IntFilter<"Empenho"> | number;
    status?: Prisma.EnumEmpenhoStatusFilter<"Empenho"> | $Enums.EmpenhoStatus;
    createdAt?: Prisma.DateTimeFilter<"Empenho"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Empenho"> | Date | string;
    company_id?: Prisma.StringFilter<"Empenho"> | string;
    company?: Prisma.XOR<Prisma.CompanyScalarRelationFilter, Prisma.CompanyWhereInput>;
    notaFiscals?: Prisma.NotaFiscalListRelationFilter;
};
export type EmpenhoOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    numero?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    startAt?: Prisma.SortOrder;
    endAt?: Prisma.SortOrder;
    value?: Prisma.SortOrder;
    totalPaid?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    company_id?: Prisma.SortOrder;
    company?: Prisma.CompanyOrderByWithRelationInput;
    notaFiscals?: Prisma.NotaFiscalOrderByRelationAggregateInput;
};
export type EmpenhoWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    numero?: string;
    AND?: Prisma.EmpenhoWhereInput | Prisma.EmpenhoWhereInput[];
    OR?: Prisma.EmpenhoWhereInput[];
    NOT?: Prisma.EmpenhoWhereInput | Prisma.EmpenhoWhereInput[];
    description?: Prisma.StringFilter<"Empenho"> | string;
    startAt?: Prisma.DateTimeFilter<"Empenho"> | Date | string;
    endAt?: Prisma.DateTimeFilter<"Empenho"> | Date | string;
    value?: Prisma.IntFilter<"Empenho"> | number;
    totalPaid?: Prisma.IntFilter<"Empenho"> | number;
    status?: Prisma.EnumEmpenhoStatusFilter<"Empenho"> | $Enums.EmpenhoStatus;
    createdAt?: Prisma.DateTimeFilter<"Empenho"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Empenho"> | Date | string;
    company_id?: Prisma.StringFilter<"Empenho"> | string;
    company?: Prisma.XOR<Prisma.CompanyScalarRelationFilter, Prisma.CompanyWhereInput>;
    notaFiscals?: Prisma.NotaFiscalListRelationFilter;
}, "id" | "numero">;
export type EmpenhoOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    numero?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    startAt?: Prisma.SortOrder;
    endAt?: Prisma.SortOrder;
    value?: Prisma.SortOrder;
    totalPaid?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    company_id?: Prisma.SortOrder;
    _count?: Prisma.EmpenhoCountOrderByAggregateInput;
    _avg?: Prisma.EmpenhoAvgOrderByAggregateInput;
    _max?: Prisma.EmpenhoMaxOrderByAggregateInput;
    _min?: Prisma.EmpenhoMinOrderByAggregateInput;
    _sum?: Prisma.EmpenhoSumOrderByAggregateInput;
};
export type EmpenhoScalarWhereWithAggregatesInput = {
    AND?: Prisma.EmpenhoScalarWhereWithAggregatesInput | Prisma.EmpenhoScalarWhereWithAggregatesInput[];
    OR?: Prisma.EmpenhoScalarWhereWithAggregatesInput[];
    NOT?: Prisma.EmpenhoScalarWhereWithAggregatesInput | Prisma.EmpenhoScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Empenho"> | string;
    numero?: Prisma.StringWithAggregatesFilter<"Empenho"> | string;
    description?: Prisma.StringWithAggregatesFilter<"Empenho"> | string;
    startAt?: Prisma.DateTimeWithAggregatesFilter<"Empenho"> | Date | string;
    endAt?: Prisma.DateTimeWithAggregatesFilter<"Empenho"> | Date | string;
    value?: Prisma.IntWithAggregatesFilter<"Empenho"> | number;
    totalPaid?: Prisma.IntWithAggregatesFilter<"Empenho"> | number;
    status?: Prisma.EnumEmpenhoStatusWithAggregatesFilter<"Empenho"> | $Enums.EmpenhoStatus;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Empenho"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Empenho"> | Date | string;
    company_id?: Prisma.StringWithAggregatesFilter<"Empenho"> | string;
};
export type EmpenhoCreateInput = {
    id?: string;
    numero: string;
    description: string;
    startAt: Date | string;
    endAt: Date | string;
    value: number;
    totalPaid?: number;
    status?: $Enums.EmpenhoStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    company: Prisma.CompanyCreateNestedOneWithoutEmpenhosInput;
    notaFiscals?: Prisma.NotaFiscalCreateNestedManyWithoutEmpenhoInput;
};
export type EmpenhoUncheckedCreateInput = {
    id?: string;
    numero: string;
    description: string;
    startAt: Date | string;
    endAt: Date | string;
    value: number;
    totalPaid?: number;
    status?: $Enums.EmpenhoStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    company_id: string;
    notaFiscals?: Prisma.NotaFiscalUncheckedCreateNestedManyWithoutEmpenhoInput;
};
export type EmpenhoUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    startAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    totalPaid?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumEmpenhoStatusFieldUpdateOperationsInput | $Enums.EmpenhoStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    company?: Prisma.CompanyUpdateOneRequiredWithoutEmpenhosNestedInput;
    notaFiscals?: Prisma.NotaFiscalUpdateManyWithoutEmpenhoNestedInput;
};
export type EmpenhoUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    startAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    totalPaid?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumEmpenhoStatusFieldUpdateOperationsInput | $Enums.EmpenhoStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    company_id?: Prisma.StringFieldUpdateOperationsInput | string;
    notaFiscals?: Prisma.NotaFiscalUncheckedUpdateManyWithoutEmpenhoNestedInput;
};
export type EmpenhoCreateManyInput = {
    id?: string;
    numero: string;
    description: string;
    startAt: Date | string;
    endAt: Date | string;
    value: number;
    totalPaid?: number;
    status?: $Enums.EmpenhoStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    company_id: string;
};
export type EmpenhoUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    startAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    totalPaid?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumEmpenhoStatusFieldUpdateOperationsInput | $Enums.EmpenhoStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type EmpenhoUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    startAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    totalPaid?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumEmpenhoStatusFieldUpdateOperationsInput | $Enums.EmpenhoStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    company_id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type EmpenhoListRelationFilter = {
    every?: Prisma.EmpenhoWhereInput;
    some?: Prisma.EmpenhoWhereInput;
    none?: Prisma.EmpenhoWhereInput;
};
export type EmpenhoOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type EmpenhoCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    numero?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    startAt?: Prisma.SortOrder;
    endAt?: Prisma.SortOrder;
    value?: Prisma.SortOrder;
    totalPaid?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    company_id?: Prisma.SortOrder;
};
export type EmpenhoAvgOrderByAggregateInput = {
    value?: Prisma.SortOrder;
    totalPaid?: Prisma.SortOrder;
};
export type EmpenhoMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    numero?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    startAt?: Prisma.SortOrder;
    endAt?: Prisma.SortOrder;
    value?: Prisma.SortOrder;
    totalPaid?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    company_id?: Prisma.SortOrder;
};
export type EmpenhoMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    numero?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    startAt?: Prisma.SortOrder;
    endAt?: Prisma.SortOrder;
    value?: Prisma.SortOrder;
    totalPaid?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    company_id?: Prisma.SortOrder;
};
export type EmpenhoSumOrderByAggregateInput = {
    value?: Prisma.SortOrder;
    totalPaid?: Prisma.SortOrder;
};
export type EmpenhoScalarRelationFilter = {
    is?: Prisma.EmpenhoWhereInput;
    isNot?: Prisma.EmpenhoWhereInput;
};
export type EmpenhoCreateNestedManyWithoutCompanyInput = {
    create?: Prisma.XOR<Prisma.EmpenhoCreateWithoutCompanyInput, Prisma.EmpenhoUncheckedCreateWithoutCompanyInput> | Prisma.EmpenhoCreateWithoutCompanyInput[] | Prisma.EmpenhoUncheckedCreateWithoutCompanyInput[];
    connectOrCreate?: Prisma.EmpenhoCreateOrConnectWithoutCompanyInput | Prisma.EmpenhoCreateOrConnectWithoutCompanyInput[];
    createMany?: Prisma.EmpenhoCreateManyCompanyInputEnvelope;
    connect?: Prisma.EmpenhoWhereUniqueInput | Prisma.EmpenhoWhereUniqueInput[];
};
export type EmpenhoUncheckedCreateNestedManyWithoutCompanyInput = {
    create?: Prisma.XOR<Prisma.EmpenhoCreateWithoutCompanyInput, Prisma.EmpenhoUncheckedCreateWithoutCompanyInput> | Prisma.EmpenhoCreateWithoutCompanyInput[] | Prisma.EmpenhoUncheckedCreateWithoutCompanyInput[];
    connectOrCreate?: Prisma.EmpenhoCreateOrConnectWithoutCompanyInput | Prisma.EmpenhoCreateOrConnectWithoutCompanyInput[];
    createMany?: Prisma.EmpenhoCreateManyCompanyInputEnvelope;
    connect?: Prisma.EmpenhoWhereUniqueInput | Prisma.EmpenhoWhereUniqueInput[];
};
export type EmpenhoUpdateManyWithoutCompanyNestedInput = {
    create?: Prisma.XOR<Prisma.EmpenhoCreateWithoutCompanyInput, Prisma.EmpenhoUncheckedCreateWithoutCompanyInput> | Prisma.EmpenhoCreateWithoutCompanyInput[] | Prisma.EmpenhoUncheckedCreateWithoutCompanyInput[];
    connectOrCreate?: Prisma.EmpenhoCreateOrConnectWithoutCompanyInput | Prisma.EmpenhoCreateOrConnectWithoutCompanyInput[];
    upsert?: Prisma.EmpenhoUpsertWithWhereUniqueWithoutCompanyInput | Prisma.EmpenhoUpsertWithWhereUniqueWithoutCompanyInput[];
    createMany?: Prisma.EmpenhoCreateManyCompanyInputEnvelope;
    set?: Prisma.EmpenhoWhereUniqueInput | Prisma.EmpenhoWhereUniqueInput[];
    disconnect?: Prisma.EmpenhoWhereUniqueInput | Prisma.EmpenhoWhereUniqueInput[];
    delete?: Prisma.EmpenhoWhereUniqueInput | Prisma.EmpenhoWhereUniqueInput[];
    connect?: Prisma.EmpenhoWhereUniqueInput | Prisma.EmpenhoWhereUniqueInput[];
    update?: Prisma.EmpenhoUpdateWithWhereUniqueWithoutCompanyInput | Prisma.EmpenhoUpdateWithWhereUniqueWithoutCompanyInput[];
    updateMany?: Prisma.EmpenhoUpdateManyWithWhereWithoutCompanyInput | Prisma.EmpenhoUpdateManyWithWhereWithoutCompanyInput[];
    deleteMany?: Prisma.EmpenhoScalarWhereInput | Prisma.EmpenhoScalarWhereInput[];
};
export type EmpenhoUncheckedUpdateManyWithoutCompanyNestedInput = {
    create?: Prisma.XOR<Prisma.EmpenhoCreateWithoutCompanyInput, Prisma.EmpenhoUncheckedCreateWithoutCompanyInput> | Prisma.EmpenhoCreateWithoutCompanyInput[] | Prisma.EmpenhoUncheckedCreateWithoutCompanyInput[];
    connectOrCreate?: Prisma.EmpenhoCreateOrConnectWithoutCompanyInput | Prisma.EmpenhoCreateOrConnectWithoutCompanyInput[];
    upsert?: Prisma.EmpenhoUpsertWithWhereUniqueWithoutCompanyInput | Prisma.EmpenhoUpsertWithWhereUniqueWithoutCompanyInput[];
    createMany?: Prisma.EmpenhoCreateManyCompanyInputEnvelope;
    set?: Prisma.EmpenhoWhereUniqueInput | Prisma.EmpenhoWhereUniqueInput[];
    disconnect?: Prisma.EmpenhoWhereUniqueInput | Prisma.EmpenhoWhereUniqueInput[];
    delete?: Prisma.EmpenhoWhereUniqueInput | Prisma.EmpenhoWhereUniqueInput[];
    connect?: Prisma.EmpenhoWhereUniqueInput | Prisma.EmpenhoWhereUniqueInput[];
    update?: Prisma.EmpenhoUpdateWithWhereUniqueWithoutCompanyInput | Prisma.EmpenhoUpdateWithWhereUniqueWithoutCompanyInput[];
    updateMany?: Prisma.EmpenhoUpdateManyWithWhereWithoutCompanyInput | Prisma.EmpenhoUpdateManyWithWhereWithoutCompanyInput[];
    deleteMany?: Prisma.EmpenhoScalarWhereInput | Prisma.EmpenhoScalarWhereInput[];
};
export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type EnumEmpenhoStatusFieldUpdateOperationsInput = {
    set?: $Enums.EmpenhoStatus;
};
export type EmpenhoCreateNestedOneWithoutNotaFiscalsInput = {
    create?: Prisma.XOR<Prisma.EmpenhoCreateWithoutNotaFiscalsInput, Prisma.EmpenhoUncheckedCreateWithoutNotaFiscalsInput>;
    connectOrCreate?: Prisma.EmpenhoCreateOrConnectWithoutNotaFiscalsInput;
    connect?: Prisma.EmpenhoWhereUniqueInput;
};
export type EmpenhoUpdateOneRequiredWithoutNotaFiscalsNestedInput = {
    create?: Prisma.XOR<Prisma.EmpenhoCreateWithoutNotaFiscalsInput, Prisma.EmpenhoUncheckedCreateWithoutNotaFiscalsInput>;
    connectOrCreate?: Prisma.EmpenhoCreateOrConnectWithoutNotaFiscalsInput;
    upsert?: Prisma.EmpenhoUpsertWithoutNotaFiscalsInput;
    connect?: Prisma.EmpenhoWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.EmpenhoUpdateToOneWithWhereWithoutNotaFiscalsInput, Prisma.EmpenhoUpdateWithoutNotaFiscalsInput>, Prisma.EmpenhoUncheckedUpdateWithoutNotaFiscalsInput>;
};
export type EmpenhoCreateWithoutCompanyInput = {
    id?: string;
    numero: string;
    description: string;
    startAt: Date | string;
    endAt: Date | string;
    value: number;
    totalPaid?: number;
    status?: $Enums.EmpenhoStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    notaFiscals?: Prisma.NotaFiscalCreateNestedManyWithoutEmpenhoInput;
};
export type EmpenhoUncheckedCreateWithoutCompanyInput = {
    id?: string;
    numero: string;
    description: string;
    startAt: Date | string;
    endAt: Date | string;
    value: number;
    totalPaid?: number;
    status?: $Enums.EmpenhoStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    notaFiscals?: Prisma.NotaFiscalUncheckedCreateNestedManyWithoutEmpenhoInput;
};
export type EmpenhoCreateOrConnectWithoutCompanyInput = {
    where: Prisma.EmpenhoWhereUniqueInput;
    create: Prisma.XOR<Prisma.EmpenhoCreateWithoutCompanyInput, Prisma.EmpenhoUncheckedCreateWithoutCompanyInput>;
};
export type EmpenhoCreateManyCompanyInputEnvelope = {
    data: Prisma.EmpenhoCreateManyCompanyInput | Prisma.EmpenhoCreateManyCompanyInput[];
    skipDuplicates?: boolean;
};
export type EmpenhoUpsertWithWhereUniqueWithoutCompanyInput = {
    where: Prisma.EmpenhoWhereUniqueInput;
    update: Prisma.XOR<Prisma.EmpenhoUpdateWithoutCompanyInput, Prisma.EmpenhoUncheckedUpdateWithoutCompanyInput>;
    create: Prisma.XOR<Prisma.EmpenhoCreateWithoutCompanyInput, Prisma.EmpenhoUncheckedCreateWithoutCompanyInput>;
};
export type EmpenhoUpdateWithWhereUniqueWithoutCompanyInput = {
    where: Prisma.EmpenhoWhereUniqueInput;
    data: Prisma.XOR<Prisma.EmpenhoUpdateWithoutCompanyInput, Prisma.EmpenhoUncheckedUpdateWithoutCompanyInput>;
};
export type EmpenhoUpdateManyWithWhereWithoutCompanyInput = {
    where: Prisma.EmpenhoScalarWhereInput;
    data: Prisma.XOR<Prisma.EmpenhoUpdateManyMutationInput, Prisma.EmpenhoUncheckedUpdateManyWithoutCompanyInput>;
};
export type EmpenhoScalarWhereInput = {
    AND?: Prisma.EmpenhoScalarWhereInput | Prisma.EmpenhoScalarWhereInput[];
    OR?: Prisma.EmpenhoScalarWhereInput[];
    NOT?: Prisma.EmpenhoScalarWhereInput | Prisma.EmpenhoScalarWhereInput[];
    id?: Prisma.StringFilter<"Empenho"> | string;
    numero?: Prisma.StringFilter<"Empenho"> | string;
    description?: Prisma.StringFilter<"Empenho"> | string;
    startAt?: Prisma.DateTimeFilter<"Empenho"> | Date | string;
    endAt?: Prisma.DateTimeFilter<"Empenho"> | Date | string;
    value?: Prisma.IntFilter<"Empenho"> | number;
    totalPaid?: Prisma.IntFilter<"Empenho"> | number;
    status?: Prisma.EnumEmpenhoStatusFilter<"Empenho"> | $Enums.EmpenhoStatus;
    createdAt?: Prisma.DateTimeFilter<"Empenho"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Empenho"> | Date | string;
    company_id?: Prisma.StringFilter<"Empenho"> | string;
};
export type EmpenhoCreateWithoutNotaFiscalsInput = {
    id?: string;
    numero: string;
    description: string;
    startAt: Date | string;
    endAt: Date | string;
    value: number;
    totalPaid?: number;
    status?: $Enums.EmpenhoStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    company: Prisma.CompanyCreateNestedOneWithoutEmpenhosInput;
};
export type EmpenhoUncheckedCreateWithoutNotaFiscalsInput = {
    id?: string;
    numero: string;
    description: string;
    startAt: Date | string;
    endAt: Date | string;
    value: number;
    totalPaid?: number;
    status?: $Enums.EmpenhoStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    company_id: string;
};
export type EmpenhoCreateOrConnectWithoutNotaFiscalsInput = {
    where: Prisma.EmpenhoWhereUniqueInput;
    create: Prisma.XOR<Prisma.EmpenhoCreateWithoutNotaFiscalsInput, Prisma.EmpenhoUncheckedCreateWithoutNotaFiscalsInput>;
};
export type EmpenhoUpsertWithoutNotaFiscalsInput = {
    update: Prisma.XOR<Prisma.EmpenhoUpdateWithoutNotaFiscalsInput, Prisma.EmpenhoUncheckedUpdateWithoutNotaFiscalsInput>;
    create: Prisma.XOR<Prisma.EmpenhoCreateWithoutNotaFiscalsInput, Prisma.EmpenhoUncheckedCreateWithoutNotaFiscalsInput>;
    where?: Prisma.EmpenhoWhereInput;
};
export type EmpenhoUpdateToOneWithWhereWithoutNotaFiscalsInput = {
    where?: Prisma.EmpenhoWhereInput;
    data: Prisma.XOR<Prisma.EmpenhoUpdateWithoutNotaFiscalsInput, Prisma.EmpenhoUncheckedUpdateWithoutNotaFiscalsInput>;
};
export type EmpenhoUpdateWithoutNotaFiscalsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    startAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    totalPaid?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumEmpenhoStatusFieldUpdateOperationsInput | $Enums.EmpenhoStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    company?: Prisma.CompanyUpdateOneRequiredWithoutEmpenhosNestedInput;
};
export type EmpenhoUncheckedUpdateWithoutNotaFiscalsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    startAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    totalPaid?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumEmpenhoStatusFieldUpdateOperationsInput | $Enums.EmpenhoStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    company_id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type EmpenhoCreateManyCompanyInput = {
    id?: string;
    numero: string;
    description: string;
    startAt: Date | string;
    endAt: Date | string;
    value: number;
    totalPaid?: number;
    status?: $Enums.EmpenhoStatus;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type EmpenhoUpdateWithoutCompanyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    startAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    totalPaid?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumEmpenhoStatusFieldUpdateOperationsInput | $Enums.EmpenhoStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    notaFiscals?: Prisma.NotaFiscalUpdateManyWithoutEmpenhoNestedInput;
};
export type EmpenhoUncheckedUpdateWithoutCompanyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    startAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    totalPaid?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumEmpenhoStatusFieldUpdateOperationsInput | $Enums.EmpenhoStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    notaFiscals?: Prisma.NotaFiscalUncheckedUpdateManyWithoutEmpenhoNestedInput;
};
export type EmpenhoUncheckedUpdateManyWithoutCompanyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    numero?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    startAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    value?: Prisma.IntFieldUpdateOperationsInput | number;
    totalPaid?: Prisma.IntFieldUpdateOperationsInput | number;
    status?: Prisma.EnumEmpenhoStatusFieldUpdateOperationsInput | $Enums.EmpenhoStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
/**
 * Count Type EmpenhoCountOutputType
 */
export type EmpenhoCountOutputType = {
    notaFiscals: number;
};
export type EmpenhoCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    notaFiscals?: boolean | EmpenhoCountOutputTypeCountNotaFiscalsArgs;
};
/**
 * EmpenhoCountOutputType without action
 */
export type EmpenhoCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmpenhoCountOutputType
     */
    select?: Prisma.EmpenhoCountOutputTypeSelect<ExtArgs> | null;
};
/**
 * EmpenhoCountOutputType without action
 */
export type EmpenhoCountOutputTypeCountNotaFiscalsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.NotaFiscalWhereInput;
};
export type EmpenhoSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    numero?: boolean;
    description?: boolean;
    startAt?: boolean;
    endAt?: boolean;
    value?: boolean;
    totalPaid?: boolean;
    status?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    company_id?: boolean;
    company?: boolean | Prisma.CompanyDefaultArgs<ExtArgs>;
    notaFiscals?: boolean | Prisma.Empenho$notaFiscalsArgs<ExtArgs>;
    _count?: boolean | Prisma.EmpenhoCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["empenho"]>;
export type EmpenhoSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    numero?: boolean;
    description?: boolean;
    startAt?: boolean;
    endAt?: boolean;
    value?: boolean;
    totalPaid?: boolean;
    status?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    company_id?: boolean;
    company?: boolean | Prisma.CompanyDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["empenho"]>;
export type EmpenhoSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    numero?: boolean;
    description?: boolean;
    startAt?: boolean;
    endAt?: boolean;
    value?: boolean;
    totalPaid?: boolean;
    status?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    company_id?: boolean;
    company?: boolean | Prisma.CompanyDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["empenho"]>;
export type EmpenhoSelectScalar = {
    id?: boolean;
    numero?: boolean;
    description?: boolean;
    startAt?: boolean;
    endAt?: boolean;
    value?: boolean;
    totalPaid?: boolean;
    status?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    company_id?: boolean;
};
export type EmpenhoOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "numero" | "description" | "startAt" | "endAt" | "value" | "totalPaid" | "status" | "createdAt" | "updatedAt" | "company_id", ExtArgs["result"]["empenho"]>;
export type EmpenhoInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    company?: boolean | Prisma.CompanyDefaultArgs<ExtArgs>;
    notaFiscals?: boolean | Prisma.Empenho$notaFiscalsArgs<ExtArgs>;
    _count?: boolean | Prisma.EmpenhoCountOutputTypeDefaultArgs<ExtArgs>;
};
export type EmpenhoIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    company?: boolean | Prisma.CompanyDefaultArgs<ExtArgs>;
};
export type EmpenhoIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    company?: boolean | Prisma.CompanyDefaultArgs<ExtArgs>;
};
export type $EmpenhoPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Empenho";
    objects: {
        company: Prisma.$CompanyPayload<ExtArgs>;
        notaFiscals: Prisma.$NotaFiscalPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        numero: string;
        description: string;
        startAt: Date;
        endAt: Date;
        value: number;
        totalPaid: number;
        status: $Enums.EmpenhoStatus;
        createdAt: Date;
        updatedAt: Date;
        company_id: string;
    }, ExtArgs["result"]["empenho"]>;
    composites: {};
};
export type EmpenhoGetPayload<S extends boolean | null | undefined | EmpenhoDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$EmpenhoPayload, S>;
export type EmpenhoCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<EmpenhoFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: EmpenhoCountAggregateInputType | true;
};
export interface EmpenhoDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Empenho'];
        meta: {
            name: 'Empenho';
        };
    };
    /**
     * Find zero or one Empenho that matches the filter.
     * @param {EmpenhoFindUniqueArgs} args - Arguments to find a Empenho
     * @example
     * // Get one Empenho
     * const empenho = await prisma.empenho.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EmpenhoFindUniqueArgs>(args: Prisma.SelectSubset<T, EmpenhoFindUniqueArgs<ExtArgs>>): Prisma.Prisma__EmpenhoClient<runtime.Types.Result.GetResult<Prisma.$EmpenhoPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one Empenho that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EmpenhoFindUniqueOrThrowArgs} args - Arguments to find a Empenho
     * @example
     * // Get one Empenho
     * const empenho = await prisma.empenho.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EmpenhoFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, EmpenhoFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__EmpenhoClient<runtime.Types.Result.GetResult<Prisma.$EmpenhoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Empenho that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmpenhoFindFirstArgs} args - Arguments to find a Empenho
     * @example
     * // Get one Empenho
     * const empenho = await prisma.empenho.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EmpenhoFindFirstArgs>(args?: Prisma.SelectSubset<T, EmpenhoFindFirstArgs<ExtArgs>>): Prisma.Prisma__EmpenhoClient<runtime.Types.Result.GetResult<Prisma.$EmpenhoPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Empenho that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmpenhoFindFirstOrThrowArgs} args - Arguments to find a Empenho
     * @example
     * // Get one Empenho
     * const empenho = await prisma.empenho.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EmpenhoFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, EmpenhoFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__EmpenhoClient<runtime.Types.Result.GetResult<Prisma.$EmpenhoPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more Empenhos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmpenhoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Empenhos
     * const empenhos = await prisma.empenho.findMany()
     *
     * // Get first 10 Empenhos
     * const empenhos = await prisma.empenho.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const empenhoWithIdOnly = await prisma.empenho.findMany({ select: { id: true } })
     *
     */
    findMany<T extends EmpenhoFindManyArgs>(args?: Prisma.SelectSubset<T, EmpenhoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$EmpenhoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a Empenho.
     * @param {EmpenhoCreateArgs} args - Arguments to create a Empenho.
     * @example
     * // Create one Empenho
     * const Empenho = await prisma.empenho.create({
     *   data: {
     *     // ... data to create a Empenho
     *   }
     * })
     *
     */
    create<T extends EmpenhoCreateArgs>(args: Prisma.SelectSubset<T, EmpenhoCreateArgs<ExtArgs>>): Prisma.Prisma__EmpenhoClient<runtime.Types.Result.GetResult<Prisma.$EmpenhoPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many Empenhos.
     * @param {EmpenhoCreateManyArgs} args - Arguments to create many Empenhos.
     * @example
     * // Create many Empenhos
     * const empenho = await prisma.empenho.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends EmpenhoCreateManyArgs>(args?: Prisma.SelectSubset<T, EmpenhoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many Empenhos and returns the data saved in the database.
     * @param {EmpenhoCreateManyAndReturnArgs} args - Arguments to create many Empenhos.
     * @example
     * // Create many Empenhos
     * const empenho = await prisma.empenho.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Empenhos and only return the `id`
     * const empenhoWithIdOnly = await prisma.empenho.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends EmpenhoCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, EmpenhoCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$EmpenhoPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a Empenho.
     * @param {EmpenhoDeleteArgs} args - Arguments to delete one Empenho.
     * @example
     * // Delete one Empenho
     * const Empenho = await prisma.empenho.delete({
     *   where: {
     *     // ... filter to delete one Empenho
     *   }
     * })
     *
     */
    delete<T extends EmpenhoDeleteArgs>(args: Prisma.SelectSubset<T, EmpenhoDeleteArgs<ExtArgs>>): Prisma.Prisma__EmpenhoClient<runtime.Types.Result.GetResult<Prisma.$EmpenhoPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one Empenho.
     * @param {EmpenhoUpdateArgs} args - Arguments to update one Empenho.
     * @example
     * // Update one Empenho
     * const empenho = await prisma.empenho.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends EmpenhoUpdateArgs>(args: Prisma.SelectSubset<T, EmpenhoUpdateArgs<ExtArgs>>): Prisma.Prisma__EmpenhoClient<runtime.Types.Result.GetResult<Prisma.$EmpenhoPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more Empenhos.
     * @param {EmpenhoDeleteManyArgs} args - Arguments to filter Empenhos to delete.
     * @example
     * // Delete a few Empenhos
     * const { count } = await prisma.empenho.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends EmpenhoDeleteManyArgs>(args?: Prisma.SelectSubset<T, EmpenhoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Empenhos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmpenhoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Empenhos
     * const empenho = await prisma.empenho.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends EmpenhoUpdateManyArgs>(args: Prisma.SelectSubset<T, EmpenhoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Empenhos and returns the data updated in the database.
     * @param {EmpenhoUpdateManyAndReturnArgs} args - Arguments to update many Empenhos.
     * @example
     * // Update many Empenhos
     * const empenho = await prisma.empenho.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Empenhos and only return the `id`
     * const empenhoWithIdOnly = await prisma.empenho.updateManyAndReturn({
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
    updateManyAndReturn<T extends EmpenhoUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, EmpenhoUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$EmpenhoPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one Empenho.
     * @param {EmpenhoUpsertArgs} args - Arguments to update or create a Empenho.
     * @example
     * // Update or create a Empenho
     * const empenho = await prisma.empenho.upsert({
     *   create: {
     *     // ... data to create a Empenho
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Empenho we want to update
     *   }
     * })
     */
    upsert<T extends EmpenhoUpsertArgs>(args: Prisma.SelectSubset<T, EmpenhoUpsertArgs<ExtArgs>>): Prisma.Prisma__EmpenhoClient<runtime.Types.Result.GetResult<Prisma.$EmpenhoPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of Empenhos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmpenhoCountArgs} args - Arguments to filter Empenhos to count.
     * @example
     * // Count the number of Empenhos
     * const count = await prisma.empenho.count({
     *   where: {
     *     // ... the filter for the Empenhos we want to count
     *   }
     * })
    **/
    count<T extends EmpenhoCountArgs>(args?: Prisma.Subset<T, EmpenhoCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], EmpenhoCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a Empenho.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmpenhoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends EmpenhoAggregateArgs>(args: Prisma.Subset<T, EmpenhoAggregateArgs>): Prisma.PrismaPromise<GetEmpenhoAggregateType<T>>;
    /**
     * Group by Empenho.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmpenhoGroupByArgs} args - Group by arguments.
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
    groupBy<T extends EmpenhoGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: EmpenhoGroupByArgs['orderBy'];
    } : {
        orderBy?: EmpenhoGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, EmpenhoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEmpenhoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Empenho model
     */
    readonly fields: EmpenhoFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for Empenho.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__EmpenhoClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    company<T extends Prisma.CompanyDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.CompanyDefaultArgs<ExtArgs>>): Prisma.Prisma__CompanyClient<runtime.Types.Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    notaFiscals<T extends Prisma.Empenho$notaFiscalsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Empenho$notaFiscalsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$NotaFiscalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
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
 * Fields of the Empenho model
 */
export interface EmpenhoFieldRefs {
    readonly id: Prisma.FieldRef<"Empenho", 'String'>;
    readonly numero: Prisma.FieldRef<"Empenho", 'String'>;
    readonly description: Prisma.FieldRef<"Empenho", 'String'>;
    readonly startAt: Prisma.FieldRef<"Empenho", 'DateTime'>;
    readonly endAt: Prisma.FieldRef<"Empenho", 'DateTime'>;
    readonly value: Prisma.FieldRef<"Empenho", 'Int'>;
    readonly totalPaid: Prisma.FieldRef<"Empenho", 'Int'>;
    readonly status: Prisma.FieldRef<"Empenho", 'EmpenhoStatus'>;
    readonly createdAt: Prisma.FieldRef<"Empenho", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Empenho", 'DateTime'>;
    readonly company_id: Prisma.FieldRef<"Empenho", 'String'>;
}
/**
 * Empenho findUnique
 */
export type EmpenhoFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which Empenho to fetch.
     */
    where: Prisma.EmpenhoWhereUniqueInput;
};
/**
 * Empenho findUniqueOrThrow
 */
export type EmpenhoFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which Empenho to fetch.
     */
    where: Prisma.EmpenhoWhereUniqueInput;
};
/**
 * Empenho findFirst
 */
export type EmpenhoFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which Empenho to fetch.
     */
    where?: Prisma.EmpenhoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Empenhos to fetch.
     */
    orderBy?: Prisma.EmpenhoOrderByWithRelationInput | Prisma.EmpenhoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Empenhos.
     */
    cursor?: Prisma.EmpenhoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Empenhos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Empenhos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Empenhos.
     */
    distinct?: Prisma.EmpenhoScalarFieldEnum | Prisma.EmpenhoScalarFieldEnum[];
};
/**
 * Empenho findFirstOrThrow
 */
export type EmpenhoFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which Empenho to fetch.
     */
    where?: Prisma.EmpenhoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Empenhos to fetch.
     */
    orderBy?: Prisma.EmpenhoOrderByWithRelationInput | Prisma.EmpenhoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Empenhos.
     */
    cursor?: Prisma.EmpenhoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Empenhos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Empenhos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Empenhos.
     */
    distinct?: Prisma.EmpenhoScalarFieldEnum | Prisma.EmpenhoScalarFieldEnum[];
};
/**
 * Empenho findMany
 */
export type EmpenhoFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which Empenhos to fetch.
     */
    where?: Prisma.EmpenhoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Empenhos to fetch.
     */
    orderBy?: Prisma.EmpenhoOrderByWithRelationInput | Prisma.EmpenhoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Empenhos.
     */
    cursor?: Prisma.EmpenhoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Empenhos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Empenhos.
     */
    skip?: number;
    distinct?: Prisma.EmpenhoScalarFieldEnum | Prisma.EmpenhoScalarFieldEnum[];
};
/**
 * Empenho create
 */
export type EmpenhoCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * The data needed to create a Empenho.
     */
    data: Prisma.XOR<Prisma.EmpenhoCreateInput, Prisma.EmpenhoUncheckedCreateInput>;
};
/**
 * Empenho createMany
 */
export type EmpenhoCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many Empenhos.
     */
    data: Prisma.EmpenhoCreateManyInput | Prisma.EmpenhoCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * Empenho createManyAndReturn
 */
export type EmpenhoCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Empenho
     */
    select?: Prisma.EmpenhoSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Empenho
     */
    omit?: Prisma.EmpenhoOmit<ExtArgs> | null;
    /**
     * The data used to create many Empenhos.
     */
    data: Prisma.EmpenhoCreateManyInput | Prisma.EmpenhoCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.EmpenhoIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * Empenho update
 */
export type EmpenhoUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * The data needed to update a Empenho.
     */
    data: Prisma.XOR<Prisma.EmpenhoUpdateInput, Prisma.EmpenhoUncheckedUpdateInput>;
    /**
     * Choose, which Empenho to update.
     */
    where: Prisma.EmpenhoWhereUniqueInput;
};
/**
 * Empenho updateMany
 */
export type EmpenhoUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update Empenhos.
     */
    data: Prisma.XOR<Prisma.EmpenhoUpdateManyMutationInput, Prisma.EmpenhoUncheckedUpdateManyInput>;
    /**
     * Filter which Empenhos to update
     */
    where?: Prisma.EmpenhoWhereInput;
    /**
     * Limit how many Empenhos to update.
     */
    limit?: number;
};
/**
 * Empenho updateManyAndReturn
 */
export type EmpenhoUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Empenho
     */
    select?: Prisma.EmpenhoSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Empenho
     */
    omit?: Prisma.EmpenhoOmit<ExtArgs> | null;
    /**
     * The data used to update Empenhos.
     */
    data: Prisma.XOR<Prisma.EmpenhoUpdateManyMutationInput, Prisma.EmpenhoUncheckedUpdateManyInput>;
    /**
     * Filter which Empenhos to update
     */
    where?: Prisma.EmpenhoWhereInput;
    /**
     * Limit how many Empenhos to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.EmpenhoIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * Empenho upsert
 */
export type EmpenhoUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * The filter to search for the Empenho to update in case it exists.
     */
    where: Prisma.EmpenhoWhereUniqueInput;
    /**
     * In case the Empenho found by the `where` argument doesn't exist, create a new Empenho with this data.
     */
    create: Prisma.XOR<Prisma.EmpenhoCreateInput, Prisma.EmpenhoUncheckedCreateInput>;
    /**
     * In case the Empenho was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.EmpenhoUpdateInput, Prisma.EmpenhoUncheckedUpdateInput>;
};
/**
 * Empenho delete
 */
export type EmpenhoDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter which Empenho to delete.
     */
    where: Prisma.EmpenhoWhereUniqueInput;
};
/**
 * Empenho deleteMany
 */
export type EmpenhoDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Empenhos to delete
     */
    where?: Prisma.EmpenhoWhereInput;
    /**
     * Limit how many Empenhos to delete.
     */
    limit?: number;
};
/**
 * Empenho.notaFiscals
 */
export type Empenho$notaFiscalsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
 * Empenho without action
 */
export type EmpenhoDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
};
export {};
//# sourceMappingURL=Empenho.d.ts.map