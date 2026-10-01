import type {
  OrdemServicoStatusValue,
  PersistedOrdemServico,
} from "../../../domain/entities/OrdemServico.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type {
  IOrdemServicoRepository,
  ListOrdensServicoResponse,
  OrdemServicoActiveCountByTenant,
  OrdemServicoListItem,
  OrdemServicoOption,
  OrdemServicoPersistData,
  OrdemServicoVinculo,
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

// Vínculos OS × empenho, na ordem em que foram feitos (o primeiro é o principal)
const VINCULOS_INCLUDE = {
  orderBy: { createdAt: "asc" },
  select: {
    valor: true,
    empenho: { select: { id: true, numero: true, description: true, value: true } },
  },
} as const;

type VinculoRow = {
  valor: number;
  empenho: { id: string; numero: string; description: string; value: number };
};

function mapVinculos(rows: VinculoRow[]): OrdemServicoVinculo[] {
  return rows.map((row) => ({
    empenho_id: row.empenho.id,
    numero: row.empenho.numero,
    description: row.empenho.description,
    valor: row.valor / 100,
    empenhoValue: row.empenho.value / 100,
  }));
}

const OBRA_INFO_SELECT = {
  id: true,
  nome: true,
  identificacaoPatrimonial: true,
  tipo: true,
  status: true,
  dataConclusao: true,
  latitude: true,
  longitude: true,
  responsavelTecnico: true,
} as const;

const LIST_ITEM_INCLUDE = {
  empenho: { select: EMPENHO_INFO_SELECT },
  empenhos: VINCULOS_INCLUDE,
  obra: { select: OBRA_INFO_SELECT },
} as const;

// Executado por OS, em centavos: soma das notas não canceladas lançadas em cada uma
async function sumExecutadoPorOS(ids: string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const grouped = await prisma.invoice.groupBy({
    by: ["ordemServico_id"],
    where: { ordemServico_id: { in: ids }, status: { not: "CANCELADO" } },
    _sum: { value: true },
  });
  return new Map(grouped.map((g) => [g.ordemServico_id ?? "", g._sum.value ?? 0] as const));
}

export class PrismaOrdemServicoRepository implements IOrdemServicoRepository {
  async create(data: OrdemServicoPersistData): Promise<OrdemServicoListItem> {
    try {
      const newOrdemServico = await prisma.ordemServico.create({
        data: {
          numero: data.numero,
          // Valor da OS = soma dos vínculos; o primeiro empenho é o principal
          valor: data.empenhos.reduce((sum, e) => sum + e.valor, 0),
          empenho_id: data.empenhos[0]!.empenho_id,
          dataInicio: data.dataInicio,
          dataPrevisaoTermino: data.dataPrevisaoTermino,
          obra_id: data.obra_id,
          tenant_id: data.tenant_id,
          empenhos: {
            create: data.empenhos.map((e) => ({ empenho_id: e.empenho_id, valor: e.valor })),
          },
        },
        include: LIST_ITEM_INCLUDE,
      });

      return {
        ...newOrdemServico,
        valor: newOrdemServico.valor / 100,
        empenhos: mapVinculos(newOrdemServico.empenhos),
        valorExecutado: 0,
      };
    } catch (error) {
      throw new DomainError("Error creating ordem de serviço: " + error);
    }
  }

  async verifyNumero(numero: string, tenant_id: string): Promise<boolean> {
    try {
      const ordemServico = await prisma.ordemServico.findFirst({
        where: { numero: { equals: numero, mode: "insensitive" }, tenant_id },
      });
      return ordemServico !== null;
    } catch (error) {
      throw new DomainError("Error verifying numero: " + error);
    }
  }

  async list(tenant_id?: string): Promise<ListOrdensServicoResponse> {
    const tenantFilter = tenant_id ? { tenant_id } : {};
    try {
      const [ordensServico, total, ativas, finalizadas, canceladas, valorAgg, executadoPorOS] = await Promise.all([
        prisma.ordemServico.findMany({
          where: tenantFilter,
          orderBy: { createdAt: "desc" },
          include: LIST_ITEM_INCLUDE,
        }),
        prisma.ordemServico.count({ where: tenantFilter }),
        prisma.ordemServico.count({ where: { ...tenantFilter, status: "ATIVO" } }),
        prisma.ordemServico.count({ where: { ...tenantFilter, status: "FINALIZADO" } }),
        prisma.ordemServico.count({ where: { ...tenantFilter, status: "CANCELADO" } }),
        prisma.ordemServico.aggregate({ where: tenantFilter, _sum: { valor: true } }),
        // Executado vem direto das notas de cada OS (fonte da verdade)
        prisma.invoice.groupBy({
          by: ["ordemServico_id"],
          where: {
            ordemServico_id: { not: null },
            status: { not: "CANCELADO" },
            ...(tenant_id ? { ordemServico: { tenant_id } } : {}),
          },
          _sum: { value: true },
        }),
      ]);

      const executadoCentavos = new Map(
        executadoPorOS.map((g) => [g.ordemServico_id, g._sum.value ?? 0] as const),
      );

      return {
        ordensServico: ordensServico.map((os) => ({
          ...os,
          valor: os.valor / 100,
          empenhos: mapVinculos(os.empenhos),
          valorExecutado: (executadoCentavos.get(os.id) ?? 0) / 100,
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
        where: { tenant_id, status: "ATIVO", obra_id: null },
        orderBy: { numero: "asc" },
        select: {
          id: true,
          numero: true,
          valor: true,
          dataInicio: true,
          dataPrevisaoTermino: true,
          empenho: { select: EMPENHO_INFO_SELECT },
          empenhos: VINCULOS_INCLUDE,
        },
      });

      return ordensServico.map((os) => ({
        ...os,
        valor: os.valor / 100,
        empenhos: mapVinculos(os.empenhos),
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

  async update(id: string, data: Omit<OrdemServicoPersistData, "tenant_id">): Promise<OrdemServicoListItem> {
    try {
      const updated = await prisma.$transaction(async (tx) => {
        const anterior = await tx.ordemServico.findUniqueOrThrow({ where: { id }, select: { obra_id: true } });
        const atuais = await tx.ordemServicoEmpenho.findMany({
          where: { ordemServico_id: id },
          orderBy: { createdAt: "asc" },
          select: { empenho_id: true },
        });
        const novosIds = new Set(data.empenhos.map((e) => e.empenho_id));

        // Sai quem não está mais na lista; os demais são criados ou têm o valor atualizado
        await tx.ordemServicoEmpenho.deleteMany({
          where: { ordemServico_id: id, empenho_id: { notIn: [...novosIds] } },
        });
        for (const vinculo of data.empenhos) {
          await tx.ordemServicoEmpenho.upsert({
            where: { ordemServico_id_empenho_id: { ordemServico_id: id, empenho_id: vinculo.empenho_id } },
            create: { ordemServico_id: id, empenho_id: vinculo.empenho_id, valor: vinculo.valor },
            update: { valor: vinculo.valor },
          });
        }

        // Principal: mantém o vínculo mais antigo que continua na OS
        const principal =
          atuais.find((a) => novosIds.has(a.empenho_id))?.empenho_id ?? data.empenhos[0]!.empenho_id;

        // OS mudou de obra: as notas dela vão junto e a execução das duas obras é recalculada
        if (anterior.obra_id !== data.obra_id) {
          await tx.invoice.updateMany({ where: { ordemServico_id: id }, data: { obra_id: data.obra_id } });
          for (const obra_id of [anterior.obra_id, data.obra_id]) {
            if (!obra_id) continue;
            const agg = await tx.invoice.aggregate({
              where: { obra_id, status: { not: "CANCELADO" } },
              _sum: { value: true },
            });
            await tx.obra.update({ where: { id: obra_id }, data: { valorExecutado: agg._sum.value ?? 0 } });
          }
        }

        return tx.ordemServico.update({
          where: { id },
          data: {
            numero: data.numero,
            valor: data.empenhos.reduce((sum, e) => sum + e.valor, 0),
            empenho_id: principal,
            dataInicio: data.dataInicio,
            dataPrevisaoTermino: data.dataPrevisaoTermino,
            obra_id: data.obra_id,
            updatedAt: new Date(),
          },
          include: LIST_ITEM_INCLUDE,
        });
      });

      const executado = await sumExecutadoPorOS([id]);
      return {
        ...updated,
        valor: updated.valor / 100,
        empenhos: mapVinculos(updated.empenhos),
        valorExecutado: (executado.get(id) ?? 0) / 100,
      };
    } catch (error) {
      throw new DomainError("Error updating ordem de serviço: " + error);
    }
  }

  async listVinculos(id: string): Promise<OrdemServicoVinculo[]> {
    try {
      const rows = await prisma.ordemServicoEmpenho.findMany({
        where: { ordemServico_id: id },
        ...VINCULOS_INCLUDE,
      });
      return mapVinculos(rows);
    } catch (error) {
      throw new DomainError("Error listing ordem de serviço empenhos: " + error);
    }
  }

  async hasInvoicesForEmpenho(id: string, empenho_id: string): Promise<boolean> {
    try {
      const invoice = await prisma.invoice.findFirst({
        where: { empenho_id, ordemServico_id: id },
        select: { id: true },
      });
      return invoice !== null;
    } catch (error) {
      throw new DomainError("Error checking ordem de serviço invoices: " + error);
    }
  }

  async hasInvoices(id: string): Promise<boolean> {
    try {
      const invoice = await prisma.invoice.findFirst({ where: { ordemServico_id: id }, select: { id: true } });
      return invoice !== null;
    } catch (error) {
      throw new DomainError("Error checking ordem de serviço invoices: " + error);
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
      const ordemServico = await prisma.ordemServico.findUnique({ where: { id }, select: { obra_id: true } });
      return Boolean(ordemServico?.obra_id);
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
