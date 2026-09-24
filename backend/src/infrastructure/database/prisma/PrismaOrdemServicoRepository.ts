import type {
  OrdemServicoEntity,
  OrdemServicoStatusValue,
  OrdemServicoType,
  PersistedOrdemServico,
} from "../../../domain/entities/OrdemServico.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type {
  IOrdemServicoRepository,
  ListOrdensServicoResponse,
  OrdemServicoActiveCountByTenant,
  OrdemServicoListItem,
  OrdemServicoOption,
} from "../../../domain/repositories/IOrdemServicoRepository.js";
import { prisma } from "../../prisma/prisma.js";

const EMPENHO_INFO_SELECT = {
  id: true,
  numero: true,
  description: true,
  contrato: {
    select: {
      id: true,
      identificador: true,
      descricaoCurta: true,
      cor: true,
      company: { select: { id: true, name: true, cnpj: true } },
    },
  },
} as const;

export class PrismaOrdemServicoRepository implements IOrdemServicoRepository {
  async create(ordemServico: OrdemServicoEntity): Promise<OrdemServicoListItem> {
    try {
      const newOrdemServico = await prisma.ordemServico.create({
        data: {
          numero: ordemServico.numero,
          valor: ordemServico.valor,
          empenho_id: ordemServico.empenho_id,
          tenant_id: ordemServico.tenant_id,
        },
        include: {
          empenho: { select: EMPENHO_INFO_SELECT },
        },
      });

      return {
        ...newOrdemServico,
        valor: newOrdemServico.valor / 100,
        obra: null,
      };
    } catch (error) {
      throw new DomainError("Error creating ordem de serviço: " + error);
    }
  }

  async verifyNumero(numero: string, tenant_id: string): Promise<boolean> {
    try {
      const ordemServico = await prisma.ordemServico.findFirst({ where: { numero, tenant_id } });
      return ordemServico !== null;
    } catch (error) {
      throw new DomainError("Error verifying numero: " + error);
    }
  }

  async list(tenant_id?: string): Promise<ListOrdensServicoResponse> {
    const tenantFilter = tenant_id ? { tenant_id } : {};
    try {
      const [ordensServico, total, ativas, finalizadas, canceladas, valorAgg] = await Promise.all([
        prisma.ordemServico.findMany({
          where: tenantFilter,
          orderBy: { createdAt: "desc" },
          include: {
            empenho: { select: EMPENHO_INFO_SELECT },
            obra: { select: { id: true, nome: true, status: true } },
          },
        }),
        prisma.ordemServico.count({ where: tenantFilter }),
        prisma.ordemServico.count({ where: { ...tenantFilter, status: "ATIVO" } }),
        prisma.ordemServico.count({ where: { ...tenantFilter, status: "FINALIZADO" } }),
        prisma.ordemServico.count({ where: { ...tenantFilter, status: "CANCELADO" } }),
        prisma.ordemServico.aggregate({ where: tenantFilter, _sum: { valor: true } }),
      ]);

      return {
        ordensServico: ordensServico.map((os) => ({
          ...os,
          valor: os.valor / 100,
        })),
        stats: {
          total,
          ativas,
          finalizadas,
          canceladas,
          valorTotal: (valorAgg._sum.valor ?? 0) / 100,
        },
      };
    } catch (error) {
      throw new DomainError("Error listing ordens de serviço: " + error);
    }
  }

  async countActiveByTenant(): Promise<OrdemServicoActiveCountByTenant[]> {
    try {
      const grouped = await prisma.ordemServico.groupBy({
        by: ["tenant_id"],
        where: { status: "ATIVO" },
        _count: true,
      });

      return grouped.map((g) => ({ tenant_id: g.tenant_id, count: g._count }));
    } catch (error) {
      throw new DomainError("Error counting active ordens de serviço by tenant: " + error);
    }
  }

  async listOptionsForObra(tenant_id: string): Promise<OrdemServicoOption[]> {
    try {
      const ordensServico = await prisma.ordemServico.findMany({
        where: { tenant_id, status: "ATIVO", obra: null },
        orderBy: { numero: "asc" },
        select: {
          id: true,
          numero: true,
          valor: true,
          empenho: { select: EMPENHO_INFO_SELECT },
        },
      });

      return ordensServico.map((os) => ({
        ...os,
        valor: os.valor / 100,
      }));
    } catch (error) {
      throw new DomainError("Error listing ordem de serviço options: " + error);
    }
  }

  async findById(id: string): Promise<PersistedOrdemServico | null> {
    try {
      const ordemServico = await prisma.ordemServico.findUnique({ where: { id } });
      if (!ordemServico) return null;
      return { ...ordemServico, valor: ordemServico.valor / 100 };
    } catch (error) {
      throw new DomainError("Error finding ordem de serviço: " + error);
    }
  }

  async update(id: string, ordemServico: OrdemServicoType): Promise<PersistedOrdemServico> {
    try {
      const updated = await prisma.ordemServico.update({
        where: { id },
        data: {
          numero: ordemServico.numero,
          valor: ordemServico.valor,
          empenho_id: ordemServico.empenho_id,
          updatedAt: new Date(),
        },
      });

      return { ...updated, valor: updated.valor / 100 };
    } catch (error) {
      throw new DomainError("Error updating ordem de serviço: " + error);
    }
  }

  async updateStatus(id: string, status: OrdemServicoStatusValue): Promise<PersistedOrdemServico> {
    try {
      const updated = await prisma.ordemServico.update({
        where: { id },
        data: { status, updatedAt: new Date() },
      });

      return { ...updated, valor: updated.valor / 100 };
    } catch (error) {
      throw new DomainError("Error updating ordem de serviço status: " + error);
    }
  }

  async hasObraVinculada(id: string): Promise<boolean> {
    try {
      const obra = await prisma.obra.findFirst({ where: { ordemServico_id: id } });
      return obra !== null;
    } catch (error) {
      throw new DomainError("Error checking ordem de serviço vínculo: " + error);
    }
  }

  async delete(id: string): Promise<void> {
    const hasObra = await this.hasObraVinculada(id);
    if (hasObra) {
      throw new DomainError(
        "Não é possível excluir a ordem de serviço: existe uma obra vinculada a ela.",
      );
    }

    try {
      await prisma.ordemServico.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new DomainError("OrdemServico not found");
      }
      if (error.code === "P2003") {
        throw new DomainError(
          "Não é possível excluir a ordem de serviço: existem registros vinculados a ela.",
        );
      }
      throw new DomainError("Error deleting ordem de serviço: " + error);
    }
  }
}
