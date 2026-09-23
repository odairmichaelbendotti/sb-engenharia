import type {
  ContratoEntity,
  ContratoStatusValue,
  ContratoType,
  PersistedContrato,
} from "../../../domain/entities/Contrato.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type {
  ContratoActiveCountByTenant,
  ContratoListItem,
  ContratoOption,
  IContratoRepository,
  ListContratosResponse,
} from "../../../domain/repositories/IContratoRepository.js";
import { prisma } from "../../prisma/prisma.js";

// Paleta categórica pra diferenciar contratos visualmente (mapa/legenda). Atribuída
// por rodízio conforme a quantidade de contratos já existentes no tenant — com poucos
// contratos (o caso comum) garante cores sempre distintas; além do tamanho da paleta,
// as cores voltam a se repetir (inevitável sem limite de contratos).
const CONTRATO_COLOR_PALETTE = [
  "#4478b6",
  "#3c8567",
  "#d48a12",
  "#8256d0",
  "#c2416b",
  "#2f9e9e",
  "#b6653c",
  "#5a6b8c",
  "#6b9e3f",
  "#a1459a",
  "#3f7ea6",
  "#c9932f",
];

export class PrismaContratoRepository implements IContratoRepository {
  async create(contrato: ContratoEntity): Promise<ContratoListItem> {
    try {
      const existingCount = await prisma.contrato.count({ where: { tenant_id: contrato.tenant_id } });
      const cor = CONTRATO_COLOR_PALETTE[existingCount % CONTRATO_COLOR_PALETTE.length] ?? CONTRATO_COLOR_PALETTE[0]!;

      const newContrato = await prisma.contrato.create({
        data: {
          identificador: contrato.identificador,
          descricaoCurta: contrato.descricaoCurta,
          valor: contrato.valor,
          dataInicio: new Date(contrato.dataInicio),
          dataFim: new Date(contrato.dataFim),
          company_id: contrato.company_id,
          tenant_id: contrato.tenant_id,
          cor,
        },
        include: {
          company: { select: { id: true, name: true, cnpj: true } },
        },
      });

      return {
        ...newContrato,
        valor: newContrato.valor / 100,
        empenhos: [],
        valorEmpenhado: 0,
        saldoDisponivel: newContrato.valor / 100,
      };
    } catch (error) {
      throw new DomainError("Error creating contrato: " + error);
    }
  }

  async verifyIdentificador(identificador: string, tenant_id: string): Promise<boolean> {
    try {
      const contrato = await prisma.contrato.findFirst({ where: { identificador, tenant_id } });
      return contrato !== null;
    } catch (error) {
      throw new DomainError("Error verifying identificador: " + error);
    }
  }

  async list(tenant_id: string): Promise<ListContratosResponse> {
    try {
      const [contratos, total, ativos, finalizados, cancelados, valorAgg] = await Promise.all([
        prisma.contrato.findMany({
          where: { tenant_id },
          orderBy: { createdAt: "desc" },
          include: {
            company: { select: { id: true, name: true, cnpj: true } },
            empenhos: {
              select: {
                id: true,
                numero: true,
                description: true,
                value: true,
                status: true,
              },
            },
          },
        }),
        prisma.contrato.count({ where: { tenant_id } }),
        prisma.contrato.count({ where: { tenant_id, status: "ATIVO" } }),
        prisma.contrato.count({ where: { tenant_id, status: "FINALIZADO" } }),
        prisma.contrato.count({ where: { tenant_id, status: "CANCELADO" } }),
        prisma.contrato.aggregate({ where: { tenant_id }, _sum: { valor: true } }),
      ]);

      return {
        contratos: contratos.map((c) => {
          const valorEmpenhadoCentavos = c.empenhos
            .filter((e) => e.status !== "CANCELADO")
            .reduce((sum, e) => sum + e.value, 0);

          return {
            ...c,
            valor: c.valor / 100,
            empenhos: c.empenhos.map((e) => ({ ...e, value: e.value / 100 })),
            valorEmpenhado: valorEmpenhadoCentavos / 100,
            saldoDisponivel: (c.valor - valorEmpenhadoCentavos) / 100,
          };
        }),
        stats: {
          total,
          ativos,
          finalizados,
          cancelados,
          valorTotal: (valorAgg._sum.valor ?? 0) / 100,
        },
      };
    } catch (error) {
      throw new DomainError("Error listing contratos: " + error);
    }
  }

  async countActiveByTenant(): Promise<ContratoActiveCountByTenant[]> {
    try {
      const grouped = await prisma.contrato.groupBy({
        by: ["tenant_id"],
        where: { status: "ATIVO" },
        _count: true,
      });

      return grouped.map((g) => ({ tenant_id: g.tenant_id, count: g._count }));
    } catch (error) {
      throw new DomainError("Error counting active contratos by tenant: " + error);
    }
  }

  async listOptionsForObra(tenant_id: string): Promise<ContratoOption[]> {
    try {
      const contratos = await prisma.contrato.findMany({
        where: { tenant_id, status: "ATIVO" },
        orderBy: { identificador: "asc" },
        select: {
          id: true,
          identificador: true,
          descricaoCurta: true,
          cor: true,
          empenhos: {
            select: { id: true, numero: true, description: true },
          },
        },
      });

      return contratos.map((c) => ({
        id: c.id,
        identificador: c.identificador,
        descricaoCurta: c.descricaoCurta,
        cor: c.cor,
        empenhos: c.empenhos,
      }));
    } catch (error) {
      throw new DomainError("Error listing contrato options: " + error);
    }
  }

  async findById(id: string): Promise<PersistedContrato | null> {
    try {
      const contrato = await prisma.contrato.findUnique({ where: { id } });
      if (!contrato) return null;
      return { ...contrato, valor: contrato.valor / 100 };
    } catch (error) {
      throw new DomainError("Error finding contrato: " + error);
    }
  }

  async update(id: string, contrato: ContratoType): Promise<PersistedContrato> {
    try {
      const updatedContrato = await prisma.contrato.update({
        where: { id },
        data: {
          identificador: contrato.identificador,
          descricaoCurta: contrato.descricaoCurta,
          valor: contrato.valor,
          dataInicio: new Date(contrato.dataInicio),
          dataFim: new Date(contrato.dataFim),
          company_id: contrato.company_id,
          updatedAt: new Date(),
        },
      });

      return { ...updatedContrato, valor: updatedContrato.valor / 100 };
    } catch (error) {
      throw new DomainError("Error updating contrato: " + error);
    }
  }

  async updateStatus(id: string, status: ContratoStatusValue): Promise<PersistedContrato> {
    try {
      const updatedContrato = await prisma.contrato.update({
        where: { id },
        data: { status, updatedAt: new Date() },
      });

      return { ...updatedContrato, valor: updatedContrato.valor / 100 };
    } catch (error) {
      throw new DomainError("Error updating contrato status: " + error);
    }
  }

  async getSaldoDisponivel(contratoId: string, excludeEmpenhoId?: string): Promise<number> {
    try {
      const contrato = await prisma.contrato.findUnique({ where: { id: contratoId } });
      if (!contrato) {
        throw new DomainError("Contrato not found");
      }

      const agg = await prisma.empenho.aggregate({
        where: {
          contrato_id: contratoId,
          status: { not: "CANCELADO" },
          ...(excludeEmpenhoId ? { id: { not: excludeEmpenhoId } } : {}),
        },
        _sum: { value: true },
      });

      const valorEmpenhadoCentavos = agg._sum.value ?? 0;
      return (contrato.valor - valorEmpenhadoCentavos) / 100;
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new DomainError("Error calculating contrato saldo: " + error);
    }
  }

  async delete(id: string): Promise<void> {
    const empenhos = await prisma.empenho.findMany({
      where: { contrato_id: id },
      select: { status: true },
    });

    if (empenhos.length > 0) {
      const hasActive = empenhos.some((empenho) => empenho.status === "ATIVO");
      throw new DomainError(
        hasActive
          ? "Não é possível excluir o contrato: existem empenhos ativos vinculados a ele."
          : "Não é possível excluir o contrato: existem empenhos vinculados a ele.",
      );
    }

    try {
      await prisma.contrato.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new DomainError("Contrato not found");
      }
      if (error.code === "P2003") {
        throw new DomainError(
          "Não é possível excluir o contrato: existem registros vinculados a ele.",
        );
      }
      throw new DomainError("Error deleting contrato: " + error);
    }
  }
}
