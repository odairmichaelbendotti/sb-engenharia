import type {
  empenhosDTO,
  EmpenhoSummaryByTenant,
  IEmpenhoRepository,
} from "../../../domain/repositories/IEmpenhoRepository.js";
import type {
  EmpenhoType,
  PersistedEmpenho,
} from "../../../domain/entities/Empenho.js";
import type { Empenho as PrismaEmpenho } from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/prisma.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { formatDate } from "../../../utils/formatDateToInsertDb.js";

export class PrismaEmpenhoRepository implements IEmpenhoRepository {
  async create(empenho: EmpenhoType): Promise<PersistedEmpenho> {
    try {
      const empenhoCreated = await prisma.empenho.create({
        data: {
          numero: empenho.numero,
          description: empenho.description,
          category: empenho.category,
          startAt: new Date(formatDate(empenho.startAt)),
          endAt: new Date(formatDate(empenho.endAt)),
          value: empenho.value,
          contrato_id: empenho.contrato_id,
          tenant_id: empenho.tenant_id,
        },
      });

      // API trabalha em reais; o banco guarda centavos
      return {
        ...empenhoCreated,
        value: empenhoCreated.value / 100,
        totalPaid: empenhoCreated.totalPaid / 100,
      };
    } catch (error) {
      throw new DomainError("Error creating empenho");
    }
  }
  async findByEmpenhoId(empenhoId: string): Promise<PersistedEmpenho | null> {
    try {
      const empenho = await prisma.empenho.findUnique({
        where: { id: empenhoId },
      });

      return empenho;
    } catch (error) {
      throw new DomainError("Error finding empenho");
    }
  }
  async list(tenant_id?: string): Promise<empenhosDTO> {
    try {
      const tenantFilter = tenant_id ? { tenant_id } : {};

      const [
        empenhos,
        totalEmpenhos,
        totalEmpenhosAmount,
        activeEmpenhos,
        activeEmpenhosAmount,
        completedEmpenhos,
        completedEmpenhosAmount,
      ] = await Promise.all([
        prisma.empenho.findMany({
          where: tenantFilter,
          include: {
            contrato: {
              select: {
                id: true,
                identificador: true,
                descricaoCurta: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                    cnpj: true,
                  },
                },
              },
            },
            // Quanto deste empenho foi destinado a cada OS
            vinculosOrdemServico: {
              select: { valor: true, ordemServico: { select: { status: true } } },
            },
          },
        }),
        prisma.empenho.count({ where: tenantFilter }),
        prisma.empenho.aggregate({
          where: tenantFilter,
          _sum: { value: true },
        }),
        prisma.empenho.count({ where: { ...tenantFilter, status: "ATIVO" } }),
        prisma.empenho.aggregate({
          where: { ...tenantFilter, status: "ATIVO" },
          _sum: { value: true },
        }),
        prisma.empenho.count({
          where: { ...tenantFilter, status: "FINALIZADO" },
        }),
        prisma.empenho.aggregate({
          where: { ...tenantFilter, status: "FINALIZADO" },
          _sum: { value: true },
        }),
      ]);

      // Liquidado é calculado na leitura a partir das notas, como em Contrato/OS
      const liquidadoPorEmpenho = await prisma.invoice.groupBy({
        by: ["empenho_id"],
        where: {
          empenho_id: { in: empenhos.map((e) => e.id) },
          status: { not: "CANCELADO" },
        },
        _sum: { value: true },
      });
      const liquidadoCentavos = new Map(liquidadoPorEmpenho.map((row) => [row.empenho_id, row._sum.value ?? 0]));

      const formattedEmpenhos = empenhos.map(
        (
          empenho: PrismaEmpenho & {
            contrato: {
              id: string;
              identificador: string;
              descricaoCurta: string;
              company: { id: string; name: string; cnpj: string };
            };
            vinculosOrdemServico: { valor: number; ordemServico: { status: string } }[];
          },
        ) => {
          const { vinculosOrdemServico, ...rest } = empenho;
          const valorComprometidoCentavos = vinculosOrdemServico
            .filter((vinculo) => vinculo.ordemServico.status !== "CANCELADO")
            .reduce((sum, vinculo) => sum + vinculo.valor, 0);

          return {
            ...rest,
            value: Number(empenho.value) / 100,
            totalPaid: Number(empenho.totalPaid) / 100,
            valorComprometido: valorComprometidoCentavos / 100,
            saldoDisponivel: (Number(empenho.value) - valorComprometidoCentavos) / 100,
            valorLiquidado: (liquidadoCentavos.get(empenho.id) ?? 0) / 100,
            saldoALiquidar: (Number(empenho.value) - (liquidadoCentavos.get(empenho.id) ?? 0)) / 100,
          };
        },
      );

      const mergedData = {
        empenhos: formattedEmpenhos,
        totalEmpenhos,
        totalEmpenhosAmount: (totalEmpenhosAmount._sum.value || 0) / 100,
        activeEmpenhos,
        activeEmpenhosAmount: (activeEmpenhosAmount._sum.value || 0) / 100,
        completedEmpenhos,
        completedEmpenhosAmount:
          (completedEmpenhosAmount._sum.value || 0) / 100,
      };

      return mergedData;
    } catch (error) {
      throw new DomainError("Error listing empenhos");
    }
  }
  async summaryByTenant(): Promise<EmpenhoSummaryByTenant[]> {
    try {
      const grouped = await prisma.empenho.groupBy({
        by: ["tenant_id"],
        where: { status: "ATIVO" },
        _count: true,
        _sum: { value: true },
      });

      return grouped.map((g) => ({
        tenant_id: g.tenant_id,
        ativos: g._count,
        valorAtivos: (g._sum.value ?? 0) / 100,
      }));
    } catch (error) {
      throw new DomainError("Error summarizing empenhos by tenant");
    }
  }

  async delete(empenhoId: string): Promise<void> {
    const [vinculos, invoices] = await Promise.all([
      prisma.ordemServicoEmpenho.findMany({
        where: { empenho_id: empenhoId },
        select: { ordemServico: { select: { status: true } } },
      }),
      prisma.invoice.findMany({
        where: { empenho_id: empenhoId },
        select: { status: true },
      }),
    ]);

    if (vinculos.length > 0) {
      const hasActive = vinculos.some((vinculo) => vinculo.ordemServico.status === "ATIVO");
      throw new DomainError(
        hasActive
          ? "Não é possível excluir o empenho: existem ordens de serviço ativas vinculadas a ele."
          : "Não é possível excluir o empenho: existem ordens de serviço vinculadas a ele.",
      );
    }

    if (invoices.length > 0) {
      const hasActive = invoices.some((invoice) => invoice.status !== "CANCELADO");
      throw new DomainError(
        hasActive
          ? "Não é possível excluir o empenho: existem notas fiscais ativas vinculadas a ele."
          : "Não é possível excluir o empenho: existem notas fiscais vinculadas a ele.",
      );
    }

    try {
      await prisma.empenho.delete({
        where: { id: empenhoId },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new DomainError("Empenho not found");
      }
      if (error.code === "P2003") {
        throw new DomainError(
          "Não é possível excluir o empenho: existem registros vinculados a ele.",
        );
      }
      throw new DomainError("Error deleting empenho: " + error);
    }
  }
  async update(
    empenhoId: string,
    empenho: EmpenhoType,
  ): Promise<PersistedEmpenho> {
    try {
      const updated = await prisma.empenho.update({
        where: { id: empenhoId },
        data: {
          numero: empenho.numero,
          // Math.round evita que erros de ponto flutuante quebrem o insert na coluna Int do Prisma.
          value: Math.round(empenho.value * 100),
          contrato_id: empenho.contrato_id,
          description: empenho.description,
          category: empenho.category,
          startAt: new Date(formatDate(empenho.startAt)),
          endAt: new Date(formatDate(empenho.endAt)),
        },
      });
      return { ...updated, value: updated.value / 100, totalPaid: updated.totalPaid / 100 };
    } catch (error) {
      throw new DomainError("Error updating empenho");
    }
  }
  async updateStatus(
    empenhoId: string,
    status: "ATIVO" | "FINALIZADO" | "CANCELADO",
  ): Promise<PersistedEmpenho> {
    try {
      const empenho = await prisma.empenho.update({
        where: { id: empenhoId },
        data: {
          status: status,
        },
      });
      return empenho;
    } catch (error) {
      throw new DomainError("Error updating empenho status");
    }
  }

  async getSaldoDisponivel(empenhoId: string, excludeOrdemServicoId?: string): Promise<number> {
    try {
      const empenho = await prisma.empenho.findUnique({ where: { id: empenhoId } });
      if (!empenho) {
        throw new DomainError("Empenho not found");
      }

      // Soma do que já foi destinado a OS não canceladas (exceto a OS em edição)
      const agg = await prisma.ordemServicoEmpenho.aggregate({
        where: {
          empenho_id: empenhoId,
          ordemServico: {
            status: { not: "CANCELADO" },
            ...(excludeOrdemServicoId ? { id: { not: excludeOrdemServicoId } } : {}),
          },
        },
        _sum: { valor: true },
      });

      const valorUtilizadoCentavos = agg._sum.valor ?? 0;
      return (empenho.value - valorUtilizadoCentavos) / 100;
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new DomainError("Error calculating empenho saldo: " + error);
    }
  }
}
