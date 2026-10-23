import type { OrdemServico } from "./ordem-servico";
import type { User } from "./user";

// Espelha backend/src/domain/tramitacao/ciencia.ts
export type FaseEmissao =
  | "DISPENSADA"
  | "AGUARDANDO_CIENCIA"
  | "CIENCIA_VENCIDA"
  | "EM_CONTESTACAO"
  | "EFETIVADA";

export type OrdemServicoEventoTipo =
  | "EMITIDA"
  | "REEMITIDA"
  | "VISUALIZADA"
  | "CIENTE"
  | "PRAZO_VENCIDO"
  | "CONTESTACAO"
  | "CONTESTACAO_ACATADA"
  | "CONTESTACAO_RECUSADA"
  | "COMENTARIO"
  | "STATUS_ALTERADO";

export type OrdemServicoEvento = {
  id: string;
  tipo: OrdemServicoEventoTipo;
  texto: string | null;
  createdAt: string;
  autorNome: string;
  // Role no momento do evento, ou "SISTEMA" nos automáticos
  autorPerfil: User["role"] | "SISTEMA";
  autorEmpresa: string | null;
  contestacao_id: string | null;
};

export type ContestacaoStatus = "ABERTA" | "ACATADA" | "RECUSADA";

export type OrdemServicoContestacao = {
  id: string;
  ordemServico_id: string;
  texto: string;
  status: ContestacaoStatus;
  createdAt: string;
  autorNome: string;
  resposta: string | null;
  respondidoPorNome: string | null;
  respondidoEm: string | null;
};

export type OrdemServicoTramitacao = {
  situacao: {
    fase: FaseEmissao;
    emitidaEm: string | null;
    cienciaPrazoAte: string | null;
    visualizadaEm: string | null;
    cienteEm: string | null;
    cienteNome: string | null;
    contestacoesAbertas: number;
    // Relógio do servidor no momento da consulta
    serverNow: string;
  };
  // O que o usuário logado pode fazer agora (o backend confere de novo em cada ação)
  permissoes: {
    darCiencia: boolean;
    contestar: boolean;
    comentar: boolean;
    responder: boolean;
  };
  eventos: OrdemServicoEvento[];
  contestacoes: OrdemServicoContestacao[];
};

export type PendenciaCiencia = {
  ordemServico: OrdemServico;
  cienciaPrazoAte: string;
  vencida: boolean;
};

export type PendenciasCiencia = {
  // Alguma vencida: a empresa só acessa as pendências até dar ciência
  bloqueada: boolean;
  serverNow: string;
  pendencias: PendenciaCiencia[];
};

export type NotificacaoTipo =
  | "OS_EMITIDA"
  | "OS_REEMITIDA"
  | "OS_CIENTE"
  | "OS_PRAZO_VENCIDO"
  | "OS_CONTESTACAO"
  | "OS_CONTESTACAO_RESPONDIDA"
  | "OS_COMENTARIO";

export type Notificacao = {
  id: string;
  tipo: NotificacaoTipo;
  titulo: string;
  mensagem: string;
  createdAt: string;
  ordemServico_id: string | null;
  lidaEm: string | null;
};
