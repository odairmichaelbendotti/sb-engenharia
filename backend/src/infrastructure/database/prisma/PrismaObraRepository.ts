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
  ObraOptionForInvoice,
  ObraOrdemServicoInfo,
  ObraSummaryByTenant,
} from "../../../domain/repositories/IObraRepository.js";
import { prisma } from "../../prisma/prisma.js";

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

      const [obras, total, emAndamento, concluidas, paralisadas, canceladas, valorExecutadoAgg] =
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
          prisma.obra.aggregate({ where: baseWhere, _sum: { valorExecutado: true } }),
        ]);

      // Obra não tem mais orçamento próprio — o "orçamento" da obra é o valor
      // integral da ordem de serviço vinculada (1 OS : 1 Obra).
      const orcamentoTotalCentavos = obras.reduce((sum, o) => sum + o.ordemServico.valor, 0);

      return {
        obras: obras.map((o) => ({
          ...o,
          valorExecutado: o.valorExecutado / 100,
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
          valorExecutadoTotal: (valorExecutadoAgg._sum.valorExecutado ?? 0) / 100,
        },
      };
    } catch (error) {
      throw new DomainError("Error listing obras: " + error);
    }
  }

  async summaryByTenant(): Promise<ObraSummaryByTenant[]> {
    try {
      const obras = await prisma.obra.findMany({
        select: {
          tenant_id: true,
          status: true,
          valorExecutado: true,
          ordemServico: { select: { valor: true } },
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
        entry.valorExecutadoTotal += o.valorExecutado / 100;
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
        },
      });

      return {
        ...updatedObra,
        valorExecutado: updatedObra.valorExecutado / 100,
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
        },
      });

      return {
        ...updatedObra,
        valorExecutado: updatedObra.valorExecutado / 100,
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
