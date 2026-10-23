import { DomainError } from "../../../domain/errors/DomainError.js";
import type {
  INotificacaoRepository,
  NotificacaoItem,
  NotificacaoPublico,
} from "../../../domain/repositories/INotificacaoRepository.js";
import { prisma } from "../../prisma/prisma.js";

function publicoWhere(publico: NotificacaoPublico) {
  return publico.destino === "EMPRESA"
    ? { destino: "EMPRESA" as const, tenant_id: publico.tenant_id, company_id: publico.company_id }
    : { destino: "FISCALIZACAO" as const, tenant_id: publico.tenant_id };
}

export class PrismaNotificacaoRepository implements INotificacaoRepository {
  async list({
    publico,
    user_id,
    limit,
  }: {
    publico: NotificacaoPublico;
    user_id: string;
    limit: number;
  }): Promise<NotificacaoItem[]> {
    try {
      const rows = await prisma.notificacao.findMany({
        where: publicoWhere(publico),
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          tipo: true,
          titulo: true,
          mensagem: true,
          createdAt: true,
          ordemServico_id: true,
          leituras: { where: { user_id }, select: { lidaEm: true } },
        },
      });
      return rows.map(({ leituras, ...row }) => ({ ...row, lidaEm: leituras[0]?.lidaEm ?? null }));
    } catch (error) {
      throw new DomainError("Error listing notificações: " + error);
    }
  }

  async countNaoLidas({ publico, user_id }: { publico: NotificacaoPublico; user_id: string }): Promise<number> {
    try {
      return await prisma.notificacao.count({
        where: { ...publicoWhere(publico), leituras: { none: { user_id } } },
      });
    } catch (error) {
      throw new DomainError("Error counting notificações: " + error);
    }
  }

  async marcarLida({
    publico,
    user_id,
    notificacao_id,
  }: {
    publico: NotificacaoPublico;
    user_id: string;
    notificacao_id: string;
  }): Promise<void> {
    try {
      const notificacao = await prisma.notificacao.findFirst({
        where: { id: notificacao_id, ...publicoWhere(publico) },
        select: { id: true },
      });
      if (!notificacao) throw new DomainError("Notificação not found");
      // A primeira leitura vale: ler de novo não muda a data
      await prisma.notificacaoLeitura.upsert({
        where: { notificacao_id_user_id: { notificacao_id, user_id } },
        create: { notificacao_id, user_id },
        update: {},
      });
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new DomainError("Error marking notificação as read: " + error);
    }
  }

  async marcarTodasLidas({ publico, user_id }: { publico: NotificacaoPublico; user_id: string }): Promise<void> {
    try {
      const naoLidas = await prisma.notificacao.findMany({
        where: { ...publicoWhere(publico), leituras: { none: { user_id } } },
        select: { id: true },
      });
      if (naoLidas.length === 0) return;
      await prisma.notificacaoLeitura.createMany({
        data: naoLidas.map((n) => ({ notificacao_id: n.id, user_id })),
        skipDuplicates: true,
      });
    } catch (error) {
      throw new DomainError("Error marking notificações as read: " + error);
    }
  }
}
