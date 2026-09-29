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
  ObraOptionForInvoice,
  ObraOrdemServicoInfo,
  ObraSummaryByTenant,
} from "../../../domain/repositories/IObraRepository.js";
import { prisma } from "../../prisma/prisma.js";

// Soma, em centavos, das notas não canceladas
function sumActiveInvoicesCents(invoices: { value: number; status: string }[]): number {
  return invoices.filter((i) => i.status !== "CANCELADO").reduce((sum, i) => sum + i.value, 0);
}

const INVOICE_INFO_SELECT = {
  id: true,
  numero: true,
  description: true,
  vencimento: true,
  value: true,
  status: true,
} as const;

const ORDEM_SERVICO_INFO_SELECT = {
  id: true,
  numero: true,
  valor: true,
  status: true,
  empenho: {
    select: {
      id: true,
      numero: true,
      description: true,
      category: true,
      status: true,
      value: true,
      totalPaid: true,
      startAt: true,
      endAt: true,
      contrato: {
        select: {
          id: true,
          identificador: true,
          descricaoCurta: true,
          cor: true,
          company: { select: { id: true, name: true, cnpj: true } },
        },
      },
    },
  },
} as const;

function mapOrdemServico<T extends { valor: number; empenho: { value: number; totalPaid: number } }>(
  ordemServico: T,
) {
  return {
    ...ordemServico,
    valor: ordemServico.valor / 100,
    empenho: {
      ...ordemServico.empenho,
      value: ordemServico.empenho.value / 100,
      totalPaid: ordemServico.empenho.totalPaid / 100,
    },
  };
}

export class PrismaObraRepository implements IObraRepository {
  async create(obra: ObraEntity): Promise<PersistedObra & ObraOrdemServicoInfo> {
    try {
      const newObra = await prisma.obra.create({
        data: {
          nome: obra.nome,
          identificacaoPatrimonial: obra.identificacaoPatrimonial,
          tipo: obra.tipo,
          descricao: obra.descricao,
          latitude: obra.latitude ?? null,
          longitude: obra.longitude ?? null,
          dataInicio: new Date(obra.dataInicio),
          dataPrevisaoTermino: new Date(obra.dataPrevisaoTermino),
          responsavelTecnico: obra.responsavelTecnico,
          anotacoes: obra.anotacoes ?? null,
          tenant_id: obra.tenant_id,
          ordemServico_id: obra.ordemServico_id,
        },
        include: {
          ordemServico: { select: ORDEM_SERVICO_INFO_SELECT },
        },
      });

      return {
        ...newObra,
        valorExecutado: newObra.valorExecutado / 100,
        ordemServico: mapOrdemServico(newObra.ordemServico),
      };
    } catch (error) {
      throw new DomainError("Error creating obra: " + error);
    }
  }

  async list(tenant_id: string | undefined, company_id?: string, includeInvoices?: boolean): Promise<ListObrasResponse> {
    try {
      const baseWhere = {
        ...(tenant_id ? { tenant_id } : {}),
        ...(company_id
          ? { ordemServico: { empenho: { contrato: { company_id } } } }
          : {}),
      };

      const [obras, total, emAndamento, concluidas, paralisadas, canceladas] =
        await Promise.all([
          prisma.obra.findMany({
            where: baseWhere,
            orderBy: { createdAt: "desc" },
            include: {
              ordemServico: { select: ORDEM_SERVICO_INFO_SELECT },
              invoices: { select: INVOICE_INFO_SELECT, orderBy: { vencimento: "asc" } },
            },
          }),
          prisma.obra.count({ where: baseWhere }),
          prisma.obra.count({ where: { ...baseWhere, status: "EM_ANDAMENTO" } }),
          prisma.obra.count({ where: { ...baseWhere, status: "CONCLUIDA" } }),
          prisma.obra.count({ where: { ...baseWhere, status: "PARALISADA" } }),
          prisma.obra.count({ where: { ...baseWhere, status: "CANCELADA" } }),
        ]);

      // Executado calculado na leitura a partir das notas (não o campo gravado),
      // como no detalhe da obra — não depende do recálculo ter rodado
      const executadoCentavos = new Map(obras.map((o) => [o.id, sumActiveInvoicesCents(o.invoices)]));
      const valorExecutadoTotalCentavos = obras.reduce((sum, o) => sum + (executadoCentavos.get(o.id) ?? 0), 0);

      // Obra não tem mais orçamento próprio — o "orçamento" da obra é o valor
      // integral da ordem de serviço vinculada (1 OS : 1 Obra).
      const orcamentoTotalCentavos = obras.reduce((sum, o) => sum + o.ordemServico.valor, 0);

      return {
        obras: obras.map((o) => ({
          ...o,
          valorExecutado: (executadoCentavos.get(o.id) ?? 0) / 100,
          ordemServico: mapOrdemServico(o.ordemServico),
          // Sempre buscamos a relação (simplifica a tipagem do Prisma), mas só
          // devolvemos o dado financeiro pro cliente quando ele tem permissão
          // de ver o domínio administrativo — evita vazar nota fiscal pra quem
          // só tem acesso de engenharia, mesmo que a UI já esconda a aba.
          invoices: includeInvoices
            ? o.invoices.map((invoice) => ({ ...invoice, value: invoice.value / 100 }))
            : [],
        })),
        stats: {
          total,
          emAndamento,
          concluidas,
          paralisadas,
          canceladas,
          orcamentoTotal: orcamentoTotalCentavos / 100,
          valorExecutadoTotal: valorExecutadoTotalCentavos / 100,
        },
      };
    } catch (error) {
      throw new DomainError("Error listing obras: " + error);
    }
  }

  async getDetail(id: string, tenant_id: string | undefined, company_id?: string): Promise<ObraDetail | null> {
    try {
      const found = await prisma.obra.findFirst({
        where: {
          id,
          ...(tenant_id ? { tenant_id } : {}),
          ...(company_id ? { ordemServico: { empenho: { contrato: { company_id } } } } : {}),
        },
        include: {
          invoices: { select: INVOICE_INFO_SELECT, orderBy: { vencimento: "asc" } },
          ordemServico: {
            include: {
              empenho: {
                include: {
                  contrato: {
                    include: {
                      company: { select: { id: true, name: true, cnpj: true } },
                      empenhos: {
                        orderBy: { startAt: "asc" },
                        include: { ordensServico: { select: { valor: true, status: true } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!found) return null;

      const { invoices, ordemServico, valorExecutado: _stored, ...obra } = found;
      const { empenho } = ordemServico;
      const { contrato } = empenho;

      // Liquidado por empenho do contrato, somando só NFs não canceladas
      const liquidadoPorEmpenho = await prisma.invoice.groupBy({
        by: ["empenho_id"],
        where: {
          empenho_id: { in: contrato.empenhos.map((e) => e.id) },
          status: { not: "CANCELADO" },
        },
        _sum: { value: true },
      });
      const liquidadoCentavos = new Map(liquidadoPorEmpenho.map((row) => [row.empenho_id, row._sum.value ?? 0]));

      const empenhos = contrato.empenhos.map((e) => {
        const ordensAtivas = e.ordensServico.filter((os) => os.status !== "CANCELADO");
        return {
          id: e.id,
          numero: e.numero,
          description: e.description,
          status: e.status,
          startAt: e.startAt,
          endAt: e.endAt,
          valueCentavos: e.value,
          liquidadoCentavos: liquidadoCentavos.get(e.id) ?? 0,
          comprometidoCentavos: ordensAtivas.reduce((sum, os) => sum + os.valor, 0),
          ordensServicoCount: ordensAtivas.length,
        };
      });
      const empenhosAtivos = empenhos.filter((e) => e.status !== "CANCELADO");
      const empenhoAtual = empenhos.find((e) => e.id === empenho.id)!;

      const obraLiquidadoCentavos = invoices
        .filter((invoice) => invoice.status !== "CANCELADO")
        .reduce((sum, invoice) => sum + invoice.value, 0);

      return {
        obra,
        ordemServico: { id: ordemServico.id, numero: ordemServico.numero, status: ordemServico.status },
        empenho: {
          id: empenho.id,
          numero: empenho.numero,
          description: empenho.description,
          status: empenho.status,
          startAt: empenho.startAt,
          endAt: empenho.endAt,
        },
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
          ordemServico: { valor: ordemServico.valor / 100, liquidado: obraLiquidadoCentavos / 100 },
          empenho: {
            value: empenhoAtual.valueCentavos / 100,
            liquidado: empenhoAtual.liquidadoCentavos / 100,
            comprometidoOS: empenhoAtual.comprometidoCentavos / 100,
            ordensServicoCount: empenhoAtual.ordensServicoCount,
          },
          contrato: {
            valor: contrato.valor / 100,
            totalEmpenhado: empenhosAtivos.reduce((sum, e) => sum + e.valueCentavos, 0) / 100,
            totalLiquidado: empenhosAtivos.reduce((sum, e) => sum + e.liquidadoCentavos, 0) / 100,
            empenhos: empenhos.map((e) => ({
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
          ordemServico: { select: { valor: true } },
          invoices: { select: { value: true, status: true } },
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
        entry.orcamentoTotal += o.ordemServico.valor / 100;
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
      return await prisma.obra.findMany({
        where: { tenant_id, ordemServico: { empenho_id } },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true, identificacaoPatrimonial: true },
      });
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

  async findEmpenhoId(id: string): Promise<string | null> {
    try {
      const obra = await prisma.obra.findUnique({
        where: { id },
        select: { ordemServico: { select: { empenho_id: true } } },
      });
      return obra?.ordemServico.empenho_id ?? null;
    } catch (error) {
      throw new DomainError("Error finding obra: " + error);
    }
  }

  async update(id: string, obra: ObraType): Promise<PersistedObra & ObraOrdemServicoInfo> {
    try {
      const updatedObra = await prisma.obra.update({
        where: { id },
        data: {
          nome: obra.nome,
          identificacaoPatrimonial: obra.identificacaoPatrimonial,
          tipo: obra.tipo,
          descricao: obra.descricao,
          latitude: obra.latitude ?? null,
          longitude: obra.longitude ?? null,
          dataInicio: new Date(obra.dataInicio),
          dataPrevisaoTermino: new Date(obra.dataPrevisaoTermino),
          responsavelTecnico: obra.responsavelTecnico,
          anotacoes: obra.anotacoes ?? null,
          updatedAt: new Date(),
        },
        include: {
          ordemServico: { select: ORDEM_SERVICO_INFO_SELECT },
          invoices: { select: { value: true, status: true } },
        },
      });

      // Executado vem das notas; as notas em si ficam fora da resposta
      const { invoices, ...obraAtualizada } = updatedObra;
      return {
        ...obraAtualizada,
        valorExecutado: sumActiveInvoicesCents(invoices) / 100,
        ordemServico: mapOrdemServico(updatedObra.ordemServico),
      };
    } catch (error) {
      throw new DomainError("Error updating obra: " + error);
    }
  }

  async updateStatus(id: string, status: ObraStatusValue): Promise<PersistedObra & ObraOrdemServicoInfo> {
    try {
      const existing = await prisma.obra.findUnique({ where: { id } });
      const shouldSetConclusao = status === "CONCLUIDA" && !existing?.dataConclusao;

      const updatedObra = await prisma.obra.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
          ...(shouldSetConclusao ? { dataConclusao: new Date() } : {}),
        },
        include: {
          ordemServico: { select: ORDEM_SERVICO_INFO_SELECT },
          invoices: { select: { value: true, status: true } },
        },
      });

      // Executado vem das notas; as notas em si ficam fora da resposta
      const { invoices, ...obraAtualizada } = updatedObra;
      return {
        ...obraAtualizada,
        valorExecutado: sumActiveInvoicesCents(invoices) / 100,
        ordemServico: mapOrdemServico(updatedObra.ordemServico),
      };
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
