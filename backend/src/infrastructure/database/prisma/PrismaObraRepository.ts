import type {
  ObraEntity,
  ObraType,
  PersistedObra,
  ObraStatusValue,
} from "../../../domain/entities/Obra.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type {
  IObraRepository,
  ListObrasResponse,
  ObraDetail,
  ObraListItem,
  ObraOption,
  ObraOptionForInvoice,
  ObraOrdemServicoResumo,
  ObraSummaryByTenant,
} from "../../../domain/repositories/IObraRepository.js";
import { prisma } from "../../prisma/prisma.js";

type InvoiceRow = { value: number; status: string; ordemServico_id: string | null };

// Soma, em centavos, das notas não canceladas (opcionalmente só as de uma OS)
function sumActiveInvoicesCents(invoices: InvoiceRow[], ordemServico_id?: string): number {
  return invoices
    .filter((i) => i.status !== "CANCELADO" && (ordemServico_id === undefined || i.ordemServico_id === ordemServico_id))
    .reduce((sum, i) => sum + i.value, 0);
}

const INVOICE_INFO_SELECT = {
  id: true,
  empenho_id: true,
  ordemServico_id: true,
  numero: true,
  description: true,
  vencimento: true,
  value: true,
  status: true,
} as const;

const CONTRATO_INFO_SELECT = {
  id: true,
  identificador: true,
  descricaoCurta: true,
  cor: true,
  company: { select: { id: true, name: true, cnpj: true } },
} as const;

const ORDEM_SERVICO_RESUMO_SELECT = {
  id: true,
  numero: true,
  valor: true,
  status: true,
  dataInicio: true,
  dataPrevisaoTermino: true,
  empenhos: { orderBy: { createdAt: "asc" }, select: { empenho: { select: { id: true, numero: true } } } },
  empenho: { select: { contrato: { select: CONTRATO_INFO_SELECT } } },
} as const;

// OS da obra em ordem de criação (a primeira define o contrato); para EMPRESA, só as da própria empresa
function ordensServicoInclude(company_id?: string) {
  return {
    ...(company_id ? { where: { empenho: { contrato: { company_id } } } } : {}),
    orderBy: { createdAt: "asc" },
    select: ORDEM_SERVICO_RESUMO_SELECT,
  } as const;
}

function obraListInclude(company_id?: string) {
  return {
    ordensServico: ordensServicoInclude(company_id),
    invoices: { select: INVOICE_INFO_SELECT, orderBy: { vencimento: "asc" } },
  } as const;
}

type OrdemServicoRow = {
  id: string;
  numero: string;
  valor: number;
  status: string;
  dataInicio: Date | null;
  dataPrevisaoTermino: Date | null;
  empenhos: { empenho: { id: string; numero: string } }[];
  empenho: { contrato: ObraOrdemServicoResumo["contrato"] };
};

type InvoiceInfoRow = InvoiceRow & {
  id: string;
  empenho_id: string;
  numero: string;
  description: string;
  vencimento: Date;
};

type ObraRow = Omit<PersistedObra, "valorExecutado"> & {
  valorExecutado: number;
  ordensServico: OrdemServicoRow[];
  invoices: InvoiceInfoRow[];
};

function mapOrdemServicoResumo(os: OrdemServicoRow, invoices: InvoiceRow[]): ObraOrdemServicoResumo {
  return {
    id: os.id,
    numero: os.numero,
    valor: os.valor / 100,
    status: os.status,
    dataInicio: os.dataInicio,
    dataPrevisaoTermino: os.dataPrevisaoTermino,
    valorExecutado: sumActiveInvoicesCents(invoices, os.id) / 100,
    empenhos: os.empenhos.map((v) => ({ empenho_id: v.empenho.id, numero: v.empenho.numero })),
    contrato: os.empenho.contrato,
  };
}

// Prazo e orçamento da obra saem das OS: considera as não canceladas (ou todas, se só houver canceladas)
function resumoDasOS(ordensServico: { valor: number; status: string; dataInicio: Date | null; dataPrevisaoTermino: Date | null }[]) {
  const ativas = ordensServico.filter((os) => os.status !== "CANCELADO");
  const base = ativas.length > 0 ? ativas : ordensServico;
  const inicios = base.map((os) => os.dataInicio?.getTime()).filter((t): t is number => t !== undefined);
  const terminos = base.map((os) => os.dataPrevisaoTermino?.getTime()).filter((t): t is number => t !== undefined);
  return {
    dataInicio: inicios.length ? new Date(Math.min(...inicios)) : null,
    dataPrevisaoTermino: terminos.length ? new Date(Math.max(...terminos)) : null,
    valorCentavos: ativas.reduce((sum, os) => sum + os.valor, 0),
  };
}

function mapObraListItem(row: ObraRow, includeInvoices: boolean): ObraListItem {
  const { ordensServico, invoices, ...obra } = row;
  const resumo = resumoDasOS(ordensServico);
  return {
    ...obra,
    // Executado calculado na leitura a partir das notas (não o campo gravado)
    valorExecutado: sumActiveInvoicesCents(invoices) / 100,
    dataInicio: resumo.dataInicio,
    dataPrevisaoTermino: resumo.dataPrevisaoTermino,
    valor: resumo.valorCentavos / 100,
    contrato: ordensServico[0]?.empenho.contrato ?? null,
    ordensServico: ordensServico.map((os) => mapOrdemServicoResumo(os, invoices)),
    // Só devolvemos as notas para quem pode ver o domínio administrativo — evita
    // vazar nota fiscal pra quem só tem acesso de engenharia, mesmo que a UI já esconda
    invoices: includeInvoices ? invoices.map((invoice) => ({ ...invoice, value: invoice.value / 100 })) : [],
  };
}

export class PrismaObraRepository implements IObraRepository {
  private async findListItem(id: string): Promise<ObraListItem> {
    const row = await prisma.obra.findUniqueOrThrow({ where: { id }, include: obraListInclude() });
    // Resposta de create/update vai para quem edita obras; as notas ficam fora
    return mapObraListItem(row, false);
  }

  async create(obra: ObraEntity, ordemServicoIds: string[]): Promise<ObraListItem> {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const newObra = await tx.obra.create({
          data: {
            nome: obra.nome,
            identificacaoPatrimonial: obra.identificacaoPatrimonial,
            tipo: obra.tipo,
            descricao: obra.descricao,
            latitude: obra.latitude ?? null,
            longitude: obra.longitude ?? null,
            responsavelTecnico: obra.responsavelTecnico,
            anotacoes: obra.anotacoes ?? null,
            tenant_id: obra.tenant_id,
          },
        });
        await tx.ordemServico.updateMany({
          where: { id: { in: ordemServicoIds } },
          data: { obra_id: newObra.id },
        });
        return newObra;
      });

      return this.findListItem(created.id);
    } catch (error) {
      throw new DomainError("Error creating obra: " + error);
    }
  }

  async list(tenant_id: string | undefined, company_id?: string, includeInvoices?: boolean): Promise<ListObrasResponse> {
    try {
      const baseWhere = {
        ...(tenant_id ? { tenant_id } : {}),
        ...(company_id ? { ordensServico: { some: { empenho: { contrato: { company_id } } } } } : {}),
      };

      const [obras, total, emAndamento, concluidas, paralisadas, canceladas] = await Promise.all([
        prisma.obra.findMany({
          where: baseWhere,
          orderBy: { createdAt: "desc" },
          include: obraListInclude(company_id),
        }),
        prisma.obra.count({ where: baseWhere }),
        prisma.obra.count({ where: { ...baseWhere, status: "EM_ANDAMENTO" } }),
        prisma.obra.count({ where: { ...baseWhere, status: "CONCLUIDA" } }),
        prisma.obra.count({ where: { ...baseWhere, status: "PARALISADA" } }),
        prisma.obra.count({ where: { ...baseWhere, status: "CANCELADA" } }),
      ]);

      const items = obras.map((o) => mapObraListItem(o, Boolean(includeInvoices)));

      return {
        obras: items,
        stats: {
          total,
          emAndamento,
          concluidas,
          paralisadas,
          canceladas,
          // Orçamento da obra = soma das OS não canceladas vinculadas a ela
          orcamentoTotal: items.reduce((sum, o) => sum + o.valor, 0),
          valorExecutadoTotal: items.reduce((sum, o) => sum + o.valorExecutado, 0),
        },
      };
    } catch (error) {
      throw new DomainError("Error listing obras: " + error);
    }
  }

  async getDetail(id: string, tenant_id: string | undefined, company_id?: string): Promise<ObraDetail | null> {
    try {
      const EMPENHO_DETAIL_SELECT = {
        id: true,
        numero: true,
        description: true,
        status: true,
        startAt: true,
        endAt: true,
        value: true,
        vinculosOrdemServico: { select: { valor: true, ordemServico: { select: { status: true } } } },
      } as const;

      const found = await prisma.obra.findFirst({
        where: {
          id,
          ...(tenant_id ? { tenant_id } : {}),
          ...(company_id ? { ordensServico: { some: { empenho: { contrato: { company_id } } } } } : {}),
        },
        include: {
          invoices: { select: INVOICE_INFO_SELECT, orderBy: { vencimento: "asc" } },
          ordensServico: {
            ...(company_id ? { where: { empenho: { contrato: { company_id } } } } : {}),
            orderBy: { createdAt: "asc" },
            select: {
              ...ORDEM_SERVICO_RESUMO_SELECT,
              // Vínculos com o valor destinado e a situação de cada empenho
              empenhos: {
                orderBy: { createdAt: "asc" },
                select: { valor: true, empenho: { select: EMPENHO_DETAIL_SELECT } },
              },
              empenho: {
                select: {
                  contrato: {
                    select: {
                      ...CONTRATO_INFO_SELECT,
                      status: true,
                      dataInicio: true,
                      dataFim: true,
                      valor: true,
                      empenhos: { orderBy: { startAt: "asc" }, select: EMPENHO_DETAIL_SELECT },
                    },
                  },
                },
              },
            },
          },
        },
      });
      const principal = found?.ordensServico[0];
      if (!found || !principal) return null;

      const { invoices, ordensServico, valorExecutado: _stored, ...obra } = found;
      const { contrato } = principal.empenho;

      // Empenhos do contrato principal + os das OS da obra (uma OS pode ser de outro contrato)
      type EmpenhoRow = (typeof contrato.empenhos)[number];
      const empenhoRows = new Map<string, EmpenhoRow>(contrato.empenhos.map((e) => [e.id, e]));
      for (const os of ordensServico) {
        for (const vinculo of os.empenhos) {
          if (!empenhoRows.has(vinculo.empenho.id)) empenhoRows.set(vinculo.empenho.id, vinculo.empenho);
        }
      }

      // Liquidado por empenho, somando só NFs não canceladas
      const liquidadoPorEmpenho = await prisma.invoice.groupBy({
        by: ["empenho_id"],
        where: { empenho_id: { in: [...empenhoRows.keys()] }, status: { not: "CANCELADO" } },
        _sum: { value: true },
      });
      const liquidadoCentavos = new Map(liquidadoPorEmpenho.map((row) => [row.empenho_id, row._sum.value ?? 0]));

      const resumoEmpenho = (e: EmpenhoRow) => {
        const vinculosAtivos = e.vinculosOrdemServico.filter((v) => v.ordemServico.status !== "CANCELADO");
        return {
          id: e.id,
          numero: e.numero,
          description: e.description,
          status: e.status,
          startAt: e.startAt,
          endAt: e.endAt,
          valueCentavos: e.value,
          liquidadoCentavos: liquidadoCentavos.get(e.id) ?? 0,
          comprometidoCentavos: vinculosAtivos.reduce((sum, v) => sum + v.valor, 0),
          ordensServicoCount: vinculosAtivos.length,
        };
      };

      // Empenhos das OS da obra (na ordem de vínculo) e quanto cada um destina às OS não canceladas
      const valorNaObra = new Map<string, number>();
      for (const os of ordensServico) {
        for (const vinculo of os.empenhos) {
          const destinado = os.status === "CANCELADO" ? 0 : vinculo.valor;
          valorNaObra.set(vinculo.empenho.id, (valorNaObra.get(vinculo.empenho.id) ?? 0) + destinado);
        }
      }
      const empenhosDaObra = [...valorNaObra.keys()].map((empenhoId) => resumoEmpenho(empenhoRows.get(empenhoId)!));
      const empenhosContrato = contrato.empenhos.map(resumoEmpenho);
      const empenhosContratoAtivos = empenhosContrato.filter((e) => e.status !== "CANCELADO");

      const notasAtivas = invoices.filter((invoice) => invoice.status !== "CANCELADO");
      const resumo = resumoDasOS(ordensServico);

      return {
        obra: { ...obra, dataInicio: resumo.dataInicio, dataPrevisaoTermino: resumo.dataPrevisaoTermino },
        ordensServico: ordensServico.map((os) =>
          mapOrdemServicoResumo(
            {
              ...os,
              empenhos: os.empenhos.map((v) => ({ empenho: { id: v.empenho.id, numero: v.empenho.numero } })),
            },
            invoices,
          ),
        ),
        empenhos: empenhosDaObra.map((e) => ({
          id: e.id,
          numero: e.numero,
          description: e.description,
          status: e.status,
          startAt: e.startAt,
          endAt: e.endAt,
        })),
        contrato: {
          id: contrato.id,
          identificador: contrato.identificador,
          descricaoCurta: contrato.descricaoCurta,
          cor: contrato.cor,
          status: contrato.status,
          dataInicio: contrato.dataInicio,
          dataFim: contrato.dataFim,
          company: contrato.company,
        },
        financial: {
          obra: {
            valor: resumo.valorCentavos / 100,
            liquidado: notasAtivas.reduce((sum, invoice) => sum + invoice.value, 0) / 100,
          },
          empenhos: empenhosDaObra.map((e) => ({
            id: e.id,
            value: e.valueCentavos / 100,
            valorNaOS: (valorNaObra.get(e.id) ?? 0) / 100,
            liquidado: e.liquidadoCentavos / 100,
            liquidadoNaOS:
              notasAtivas.filter((invoice) => invoice.empenho_id === e.id).reduce((sum, invoice) => sum + invoice.value, 0) /
              100,
            comprometidoOS: e.comprometidoCentavos / 100,
            ordensServicoCount: e.ordensServicoCount,
          })),
          contrato: {
            valor: contrato.valor / 100,
            totalEmpenhado: empenhosContratoAtivos.reduce((sum, e) => sum + e.valueCentavos, 0) / 100,
            totalLiquidado: empenhosContratoAtivos.reduce((sum, e) => sum + e.liquidadoCentavos, 0) / 100,
            empenhos: empenhosContrato.map((e) => ({
              id: e.id,
              numero: e.numero,
              description: e.description,
              status: e.status,
              startAt: e.startAt,
              endAt: e.endAt,
              value: e.valueCentavos / 100,
              liquidado: e.liquidadoCentavos / 100,
              ordensServicoCount: e.ordensServicoCount,
            })),
          },
          invoices: invoices.map((invoice) => ({ ...invoice, value: invoice.value / 100 })),
        },
      };
    } catch (error) {
      throw new DomainError("Error getting obra detail: " + error);
    }
  }

  async summaryByTenant(): Promise<ObraSummaryByTenant[]> {
    try {
      const obras = await prisma.obra.findMany({
        select: {
          tenant_id: true,
          status: true,
          ordensServico: { select: { valor: true, status: true, dataInicio: true, dataPrevisaoTermino: true } },
          invoices: { select: { value: true, status: true, ordemServico_id: true } },
        },
      });

      const byTenant = new Map<string, ObraSummaryByTenant>();
      for (const o of obras) {
        const entry = byTenant.get(o.tenant_id) ?? {
          tenant_id: o.tenant_id,
          emAndamento: 0,
          orcamentoTotal: 0,
          valorExecutadoTotal: 0,
        };
        if (o.status === "EM_ANDAMENTO") entry.emAndamento += 1;
        entry.orcamentoTotal += resumoDasOS(o.ordensServico).valorCentavos / 100;
        entry.valorExecutadoTotal += sumActiveInvoicesCents(o.invoices) / 100;
        byTenant.set(o.tenant_id, entry);
      }

      return Array.from(byTenant.values());
    } catch (error) {
      throw new DomainError("Error summarizing obras by tenant: " + error);
    }
  }

  async listOptionsForInvoice(tenant_id: string, empenho_id: string): Promise<ObraOptionForInvoice[]> {
    try {
      // OS com obra financiadas (também) por este empenho — uma opção por OS
      const ordensServico = await prisma.ordemServico.findMany({
        where: { tenant_id, obra_id: { not: null }, empenhos: { some: { empenho_id } } },
        orderBy: [{ obra: { nome: "asc" } }, { createdAt: "asc" }],
        select: {
          id: true,
          numero: true,
          obra: { select: { id: true, nome: true, identificacaoPatrimonial: true } },
        },
      });

      return ordensServico.flatMap((os) =>
        os.obra ? [{ ...os.obra, ordemServico: { id: os.id, numero: os.numero } }] : [],
      );
    } catch (error) {
      throw new DomainError("Error listing obra options: " + error);
    }
  }

  async listOptions(tenant_id: string): Promise<ObraOption[]> {
    try {
      const obras = await prisma.obra.findMany({
        where: { tenant_id },
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          identificacaoPatrimonial: true,
          status: true,
          ordensServico: {
            select: {
              empenhos: { select: { empenho_id: true } },
              empenho: { select: { contrato_id: true } },
            },
          },
        },
      });

      return obras.map(({ ordensServico, ...obra }) => ({
        ...obra,
        empenhoIds: [...new Set(ordensServico.flatMap((os) => os.empenhos.map((v) => v.empenho_id)))],
        contratoIds: [...new Set(ordensServico.map((os) => os.empenho.contrato_id))],
      }));
    } catch (error) {
      throw new DomainError("Error listing obra options: " + error);
    }
  }

  async findById(id: string): Promise<PersistedObra | null> {
    try {
      const obra = await prisma.obra.findUnique({ where: { id } });
      if (!obra) return null;
      return { ...obra, valorExecutado: obra.valorExecutado / 100 };
    } catch (error) {
      throw new DomainError("Error finding obra: " + error);
    }
  }

  async findOrdemServicoIds(id: string): Promise<string[]> {
    try {
      const ordensServico = await prisma.ordemServico.findMany({ where: { obra_id: id }, select: { id: true } });
      return ordensServico.map((os) => os.id);
    } catch (error) {
      throw new DomainError("Error listing obra ordens de serviço: " + error);
    }
  }

  async update(id: string, obra: ObraType, ordemServicoIds?: string[]): Promise<ObraListItem> {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.obra.update({
          where: { id },
          data: {
            nome: obra.nome,
            identificacaoPatrimonial: obra.identificacaoPatrimonial,
            tipo: obra.tipo,
            descricao: obra.descricao,
            latitude: obra.latitude ?? null,
            longitude: obra.longitude ?? null,
            responsavelTecnico: obra.responsavelTecnico,
            anotacoes: obra.anotacoes ?? null,
            updatedAt: new Date(),
          },
        });

        if (ordemServicoIds) {
          // As que saem ficam sem obra; as que entram passam a ser desta obra
          await tx.ordemServico.updateMany({
            where: { obra_id: id, id: { notIn: ordemServicoIds } },
            data: { obra_id: null },
          });
          await tx.ordemServico.updateMany({
            where: { id: { in: ordemServicoIds } },
            data: { obra_id: id },
          });
        }
      });

      return this.findListItem(id);
    } catch (error) {
      throw new DomainError("Error updating obra: " + error);
    }
  }

  async updateStatus(id: string, status: ObraStatusValue): Promise<ObraListItem> {
    try {
      const existing = await prisma.obra.findUnique({ where: { id } });
      const shouldSetConclusao = status === "CONCLUIDA" && !existing?.dataConclusao;

      await prisma.obra.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
          ...(shouldSetConclusao ? { dataConclusao: new Date() } : {}),
        },
      });

      return this.findListItem(id);
    } catch (error) {
      throw new DomainError("Error updating obra status: " + error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.obra.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new DomainError("Obra not found");
      }
      throw new DomainError("Error deleting obra: " + error);
    }
  }
}
