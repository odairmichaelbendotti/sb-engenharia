import { DomainError } from "../../../domain/errors/DomainError.js";
import type {
  IOrdemServicoTramitacaoRepository,
  OrdemServicoContestacaoItem,
  OrdemServicoEventoItem,
  OrdemServicoTramitacaoInfo,
  TramitacaoAutor,
  TramitacaoEscopo,
} from "../../../domain/repositories/IOrdemServicoTramitacaoRepository.js";
import { prisma } from "../../prisma/prisma.js";
import { formatDataHora, inserirEvento, loadResumo, notificar } from "./tramitacao-tx.js";

const SISTEMA: TramitacaoAutor = { id: null, nome: "Sistema", perfil: "SISTEMA", empresa: null };

const INFO_SELECT = {
  id: true,
  numero: true,
  tenant_id: true,
  status: true,
  emitidaEm: true,
  cienciaPrazoAte: true,
  cienciaDispensada: true,
  visualizadaEm: true,
  cienteEm: true,
  cienteNome: true,
  empenho: { select: { contrato: { select: { company_id: true, company: { select: { name: true } } } } } },
  _count: { select: { contestacoes: { where: { status: "ABERTA" } } } },
} as const;

type InfoRow = {
  id: string;
  numero: string;
  tenant_id: string;
  status: OrdemServicoTramitacaoInfo["status"];
  emitidaEm: Date | null;
  cienciaPrazoAte: Date | null;
  cienciaDispensada: boolean;
  visualizadaEm: Date | null;
  cienteEm: Date | null;
  cienteNome: string | null;
  empenho: { contrato: { company_id: string; company: { name: string } } };
  _count: { contestacoes: number };
};

function toInfo({ empenho, _count, ...row }: InfoRow): OrdemServicoTramitacaoInfo {
  return {
    ...row,
    company_id: empenho.contrato.company_id,
    companyName: empenho.contrato.company.name,
    contestacoesAbertas: _count.contestacoes,
  };
}

const CONTESTACAO_SELECT = {
  id: true,
  ordemServico_id: true,
  texto: true,
  status: true,
  createdAt: true,
  autorNome: true,
  resposta: true,
  respondidoPorNome: true,
  respondidoEm: true,
} as const;

// OS que exigem ciência: ativas, emitidas pela regra nova e sem ciência da emissão atual
const AGUARDANDO_CIENCIA = {
  status: "ATIVO",
  cienciaDispensada: false,
  emitidaEm: { not: null },
  cienciaPrazoAte: { not: null },
  cienteEm: null,
} as const;

function escopoWhere({ tenant_id, company_id, ordemServico_id }: TramitacaoEscopo) {
  return {
    ...(tenant_id ? { tenant_id } : {}),
    ...(company_id ? { empenho: { contrato: { company_id } } } : {}),
    ...(ordemServico_id ? { id: ordemServico_id } : {}),
  };
}

export class PrismaOrdemServicoTramitacaoRepository implements IOrdemServicoTramitacaoRepository {
  async findInfo(ordemServico_id: string): Promise<OrdemServicoTramitacaoInfo | null> {
    try {
      const row = await prisma.ordemServico.findUnique({ where: { id: ordemServico_id }, select: INFO_SELECT });
      return row ? toInfo(row) : null;
    } catch (error) {
      throw new DomainError("Error finding ordem de serviço tramitação: " + error);
    }
  }

  async listEventos(ordemServico_id: string): Promise<OrdemServicoEventoItem[]> {
    try {
      return await prisma.ordemServicoEvento.findMany({
        where: { ordemServico_id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          tipo: true,
          texto: true,
          createdAt: true,
          autorNome: true,
          autorPerfil: true,
          autorEmpresa: true,
          contestacao_id: true,
        },
      });
    } catch (error) {
      throw new DomainError("Error listing ordem de serviço eventos: " + error);
    }
  }

  async listContestacoes(ordemServico_id: string): Promise<OrdemServicoContestacaoItem[]> {
    try {
      return await prisma.ordemServicoContestacao.findMany({
        where: { ordemServico_id },
        orderBy: { createdAt: "asc" },
        select: CONTESTACAO_SELECT,
      });
    } catch (error) {
      throw new DomainError("Error listing ordem de serviço contestações: " + error);
    }
  }

  async findContestacao(id: string): Promise<OrdemServicoContestacaoItem | null> {
    try {
      return await prisma.ordemServicoContestacao.findUnique({ where: { id }, select: CONTESTACAO_SELECT });
    } catch (error) {
      throw new DomainError("Error finding contestação: " + error);
    }
  }

  async registrarVisualizacao({
    ordemServico_id,
    autor,
    now,
  }: {
    ordemServico_id: string;
    autor: TramitacaoAutor;
    now: Date;
  }): Promise<boolean> {
    try {
      return await prisma.$transaction(async (tx) => {
        // updateMany com a condição garante uma única marcação mesmo com duas abas abertas
        const { count } = await tx.ordemServico.updateMany({
          where: { id: ordemServico_id, visualizadaEm: null },
          data: { visualizadaEm: now },
        });
        if (count === 0) return false;
        await inserirEvento(tx, {
          ordemServico_id,
          tipo: "VISUALIZADA",
          autor,
          texto: "A empresa abriu a OS no sistema.",
          createdAt: now,
        });
        return true;
      });
    } catch (error) {
      throw new DomainError("Error registering visualização: " + error);
    }
  }

  async registrarCiencia({
    ordemServico_id,
    autor,
    now,
  }: {
    ordemServico_id: string;
    autor: TramitacaoAutor;
    now: Date;
  }): Promise<boolean> {
    try {
      return await prisma.$transaction(async (tx) => {
        const { count } = await tx.ordemServico.updateMany({
          where: { id: ordemServico_id, cienteEm: null },
          data: { cienteEm: now, cienteUser_id: autor.id, cienteNome: autor.nome },
        });
        if (count === 0) return false;
        // Quem dá ciência sem ter aberto a OS antes também conta como visualização
        await tx.ordemServico.updateMany({
          where: { id: ordemServico_id, visualizadaEm: null },
          data: { visualizadaEm: now },
        });

        const resumo = await loadResumo(tx, ordemServico_id);
        await inserirEvento(tx, {
          ordemServico_id,
          tipo: "CIENTE",
          autor,
          texto: `Ciência registrada em ${formatDataHora(now)}.`,
          createdAt: now,
        });
        await notificar(tx, {
          destino: "FISCALIZACAO",
          tipo: "OS_CIENTE",
          titulo: `${resumo.numero}: empresa ciente`,
          mensagem: `${resumo.companyName} deu ciência em ${formatDataHora(now)} (${autor.nome}).`,
          tenant_id: resumo.tenant_id,
          company_id: null,
          ordemServico_id,
        });
        return true;
      });
    } catch (error) {
      throw new DomainError("Error registering ciência: " + error);
    }
  }

  async criarContestacao({
    ordemServico_id,
    autor,
    texto,
  }: {
    ordemServico_id: string;
    autor: TramitacaoAutor;
    texto: string;
  }): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const contestacao = await tx.ordemServicoContestacao.create({
          data: { ordemServico_id, texto, autor_id: autor.id!, autorNome: autor.nome },
        });
        await inserirEvento(tx, {
          ordemServico_id,
          tipo: "CONTESTACAO",
          autor,
          texto,
          contestacao_id: contestacao.id,
          createdAt: contestacao.createdAt,
        });
        const resumo = await loadResumo(tx, ordemServico_id);
        await notificar(tx, {
          destino: "FISCALIZACAO",
          tipo: "OS_CONTESTACAO",
          titulo: `${resumo.numero}: novo apontamento da empresa`,
          mensagem: `${resumo.companyName}: ${resumir(texto)}`,
          tenant_id: resumo.tenant_id,
          company_id: null,
          ordemServico_id,
        });
      });
    } catch (error) {
      throw new DomainError("Error creating contestação: " + error);
    }
  }

  async comentar({
    ordemServico_id,
    autor,
    texto,
    daEmpresa,
  }: {
    ordemServico_id: string;
    autor: TramitacaoAutor;
    texto: string;
    daEmpresa: boolean;
  }): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        await inserirEvento(tx, { ordemServico_id, tipo: "COMENTARIO", autor, texto });
        const resumo = await loadResumo(tx, ordemServico_id);
        await notificar(tx, {
          destino: daEmpresa ? "FISCALIZACAO" : "EMPRESA",
          tipo: "OS_COMENTARIO",
          titulo: `${resumo.numero}: comentário ${daEmpresa ? "da empresa" : "da fiscalização"}`,
          mensagem: `${autor.nome}: ${resumir(texto)}`,
          tenant_id: resumo.tenant_id,
          company_id: resumo.company_id,
          ordemServico_id,
        });
      });
    } catch (error) {
      throw new DomainError("Error creating comentário: " + error);
    }
  }

  async responderContestacao({
    contestacao_id,
    autor,
    decisao,
    resposta,
    now,
  }: {
    contestacao_id: string;
    autor: TramitacaoAutor;
    decisao: "ACATADA" | "RECUSADA";
    resposta: string;
    now: Date;
  }): Promise<boolean> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Só a primeira decisão vale: a condição status ABERTA impede responder duas vezes
        const { count } = await tx.ordemServicoContestacao.updateMany({
          where: { id: contestacao_id, status: "ABERTA" },
          data: {
            status: decisao,
            resposta,
            respondidoPor_id: autor.id,
            respondidoPorNome: autor.nome,
            respondidoEm: now,
          },
        });
        if (count === 0) return false;

        const { ordemServico_id } = await tx.ordemServicoContestacao.findUniqueOrThrow({
          where: { id: contestacao_id },
          select: { ordemServico_id: true },
        });
        await inserirEvento(tx, {
          ordemServico_id,
          tipo: decisao === "ACATADA" ? "CONTESTACAO_ACATADA" : "CONTESTACAO_RECUSADA",
          autor,
          texto: resposta,
          contestacao_id,
          createdAt: now,
        });
        const resumo = await loadResumo(tx, ordemServico_id);
        await notificar(tx, {
          destino: "EMPRESA",
          tipo: "OS_CONTESTACAO_RESPONDIDA",
          titulo: `${resumo.numero}: apontamento ${decisao === "ACATADA" ? "acatado" : "recusado"}`,
          mensagem: `${autor.nome}: ${resumir(resposta)}`,
          tenant_id: resumo.tenant_id,
          company_id: resumo.company_id,
          ordemServico_id,
        });
        return true;
      });
    } catch (error) {
      throw new DomainError("Error answering contestação: " + error);
    }
  }

  async registrarStatus({
    ordemServico_id,
    autor,
    texto,
  }: {
    ordemServico_id: string;
    autor: TramitacaoAutor;
    texto: string;
  }): Promise<void> {
    try {
      await inserirEvento(prisma, { ordemServico_id, tipo: "STATUS_ALTERADO", autor, texto });
    } catch (error) {
      throw new DomainError("Error registering status change: " + error);
    }
  }

  async registrarPrazosVencidos({ now, ...escopo }: TramitacaoEscopo & { now: Date }): Promise<number> {
    try {
      const vencidas = await prisma.ordemServico.findMany({
        where: {
          ...escopoWhere(escopo),
          ...AGUARDANDO_CIENCIA,
          prazoVencidoEm: null,
          cienciaPrazoAte: { lt: now },
        },
        select: { id: true, cienciaPrazoAte: true },
      });

      let registradas = 0;
      for (const os of vencidas) {
        const registrou = await prisma.$transaction(async (tx) => {
          // A condição prazoVencidoEm nulo faz só uma requisição registrar o vencimento
          const { count } = await tx.ordemServico.updateMany({
            where: { id: os.id, prazoVencidoEm: null, cienteEm: null },
            data: { prazoVencidoEm: os.cienciaPrazoAte },
          });
          if (count === 0) return false;

          const resumo = await loadResumo(tx, os.id);
          await inserirEvento(tx, {
            ordemServico_id: os.id,
            tipo: "PRAZO_VENCIDO",
            autor: SISTEMA,
            texto: "Prazo de ciência vencido sem ciência da empresa. O acesso da empresa ao sistema fica bloqueado até ela dar ciência.",
            // O evento leva a hora do vencimento, não a hora em que foi percebido
            createdAt: os.cienciaPrazoAte!,
          });
          await notificar(tx, {
            destino: "FISCALIZACAO",
            tipo: "OS_PRAZO_VENCIDO",
            titulo: `${resumo.numero}: prazo de ciência vencido`,
            mensagem: `${resumo.companyName} não deu ciência até ${formatDataHora(os.cienciaPrazoAte!)}.`,
            tenant_id: resumo.tenant_id,
            company_id: null,
            ordemServico_id: os.id,
          });
          return true;
        });
        if (registrou) registradas++;
      }
      return registradas;
    } catch (error) {
      throw new DomainError("Error registering prazos vencidos: " + error);
    }
  }

  async listAguardandoCiencia({
    tenant_id,
    company_id,
  }: {
    tenant_id: string;
    company_id: string;
  }): Promise<OrdemServicoTramitacaoInfo[]> {
    try {
      const rows = await prisma.ordemServico.findMany({
        where: { ...escopoWhere({ tenant_id, company_id }), ...AGUARDANDO_CIENCIA },
        orderBy: { cienciaPrazoAte: "asc" },
        select: INFO_SELECT,
      });
      return rows.map(toInfo);
    } catch (error) {
      throw new DomainError("Error listing ordens de serviço aguardando ciência: " + error);
    }
  }

  async hasCienciaVencida({
    tenant_id,
    company_id,
    now,
  }: {
    tenant_id: string;
    company_id: string;
    now: Date;
  }): Promise<boolean> {
    try {
      const vencida = await prisma.ordemServico.findFirst({
        where: { ...escopoWhere({ tenant_id, company_id }), ...AGUARDANDO_CIENCIA, cienciaPrazoAte: { lt: now } },
        select: { id: true },
      });
      return vencida !== null;
    } catch (error) {
      throw new DomainError("Error checking ciência vencida: " + error);
    }
  }

  async hasInteracaoEmpresa(ordemServico_id: string): Promise<boolean> {
    try {
      const evento = await prisma.ordemServicoEvento.findFirst({
        where: {
          ordemServico_id,
          OR: [
            { tipo: { in: ["VISUALIZADA", "CIENTE", "CONTESTACAO"] } },
            { tipo: "COMENTARIO", autorPerfil: "EMPRESA" },
          ],
        },
        select: { id: true },
      });
      return evento !== null;
    } catch (error) {
      throw new DomainError("Error checking ordem de serviço tramitação: " + error);
    }
  }
}

// Trecho do texto para a notificação (o texto inteiro fica no histórico)
function resumir(texto: string, max = 140) {
  const linha = texto.replace(/\s+/g, " ").trim();
  return linha.length > max ? `${linha.slice(0, max - 1)}…` : linha;
}
