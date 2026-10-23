import type { OrdemServicoEmissao } from "../../../domain/repositories/IOrdemServicoRepository.js";
import type {
  OrdemServicoEventoTipo,
  TramitacaoAutor,
} from "../../../domain/repositories/IOrdemServicoTramitacaoRepository.js";
import type { NotificacaoTipo } from "../../../domain/repositories/INotificacaoRepository.js";
import { prisma } from "../../prisma/prisma.js";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
// Escritas da tramitação aceitam o client direto ou uma transação já aberta
export type Db = Tx | typeof prisma;

// Horários dos textos do histórico e das notificações sempre no fuso da organização
const DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDataHora(date: Date) {
  return DATA_HORA.format(date).replace(", ", " às ");
}

export async function inserirEvento(
  db: Db,
  data: {
    ordemServico_id: string;
    tipo: OrdemServicoEventoTipo;
    autor: TramitacaoAutor;
    texto?: string | null;
    contestacao_id?: string | null;
    // Só para eventos datados pelo próprio fato (ex.: vencimento do prazo); o padrão é o agora do banco
    createdAt?: Date;
  },
) {
  await db.ordemServicoEvento.create({
    data: {
      ordemServico_id: data.ordemServico_id,
      tipo: data.tipo,
      texto: data.texto ?? null,
      autor_id: data.autor.id,
      autorNome: data.autor.nome,
      autorPerfil: data.autor.perfil,
      autorEmpresa: data.autor.empresa,
      contestacao_id: data.contestacao_id ?? null,
      ...(data.createdAt ? { createdAt: data.createdAt } : {}),
    },
  });
}

export async function notificar(
  db: Db,
  data: {
    destino: "EMPRESA" | "FISCALIZACAO";
    tipo: NotificacaoTipo;
    titulo: string;
    mensagem: string;
    tenant_id: string;
    company_id: string | null;
    ordemServico_id: string;
  },
) {
  await db.notificacao.create({
    data: {
      destino: data.destino,
      tipo: data.tipo,
      titulo: data.titulo,
      mensagem: data.mensagem,
      tenant_id: data.tenant_id,
      // Aviso da fiscalização é da organização toda; o da empresa vai só para ela
      company_id: data.destino === "EMPRESA" ? data.company_id : null,
      ordemServico_id: data.ordemServico_id,
    },
  });
}

export type OrdemServicoResumo = {
  id: string;
  numero: string;
  tenant_id: string;
  company_id: string;
  companyName: string;
  // Nome da obra; sem obra, a descrição do empenho (como na lista de OS)
  servico: string;
};

export async function loadResumo(db: Db, ordemServico_id: string): Promise<OrdemServicoResumo> {
  const os = await db.ordemServico.findUniqueOrThrow({
    where: { id: ordemServico_id },
    select: {
      id: true,
      numero: true,
      tenant_id: true,
      obra: { select: { nome: true } },
      empenho: {
        select: {
          description: true,
          contrato: { select: { company_id: true, company: { select: { name: true } } } },
        },
      },
    },
  });
  return {
    id: os.id,
    numero: os.numero,
    tenant_id: os.tenant_id,
    company_id: os.empenho.contrato.company_id,
    companyName: os.empenho.contrato.company.name,
    servico: os.obra?.nome ?? os.empenho.description,
  };
}

/** Evento EMITIDA/REEMITIDA e aviso à empresa, na transação que gravou a OS. */
export async function registrarEmissao(db: Db, ordemServico_id: string, emissao: OrdemServicoEmissao) {
  const resumo = await loadResumo(db, ordemServico_id);
  const prazo = formatDataHora(emissao.cienciaPrazoAte);
  const reemitida = emissao.tipo === "REEMITIDA";

  await inserirEvento(db, {
    ordemServico_id,
    tipo: emissao.tipo,
    autor: emissao.autor,
    texto: reemitida
      ? `OS alterada e reemitida para a empresa. A ciência anterior deixa de valer; novo prazo até ${prazo}.`
      : `OS emitida e enviada à empresa no sistema. Prazo para ciência até ${prazo}.`,
  });
  await notificar(db, {
    destino: "EMPRESA",
    tipo: reemitida ? "OS_REEMITIDA" : "OS_EMITIDA",
    titulo: `${resumo.numero} ${reemitida ? "reemitida" : "emitida"}`,
    mensagem: `${resumo.servico}. Dê ciência até ${prazo}.`,
    tenant_id: resumo.tenant_id,
    company_id: resumo.company_id,
    ordemServico_id,
  });
}
