import type { OrdemServicoStatusValue } from "../entities/OrdemServico.js";

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

export type ContestacaoStatus = "ABERTA" | "ACATADA" | "RECUSADA";

// Autor copiado para o histórico: se o usuário mudar depois, o registro não muda
export type TramitacaoAutor = {
  id: string | null;
  nome: string;
  // Role do usuário no momento, ou "SISTEMA" nos eventos automáticos
  perfil: string;
  // Razão social, quando o autor é da empresa
  empresa: string | null;
};

// Situação da OS na tramitação, com o que é preciso para checar acesso e regras
export type OrdemServicoTramitacaoInfo = {
  id: string;
  numero: string;
  tenant_id: string;
  status: OrdemServicoStatusValue;
  // Empresa do contrato do empenho principal
  company_id: string;
  companyName: string;
  // Ainda não emitida: a empresa não vê
  aguardandoEmissao: boolean;
  emitidaEm: Date | null;
  cienciaPrazoAte: Date | null;
  cienciaDispensada: boolean;
  visualizadaEm: Date | null;
  cienteEm: Date | null;
  cienteNome: string | null;
  contestacoesAbertas: number;
};

export type OrdemServicoEventoItem = {
  id: string;
  tipo: OrdemServicoEventoTipo;
  texto: string | null;
  createdAt: Date;
  autorNome: string;
  autorPerfil: string;
  autorEmpresa: string | null;
  contestacao_id: string | null;
};

export type OrdemServicoContestacaoItem = {
  id: string;
  ordemServico_id: string;
  texto: string;
  status: ContestacaoStatus;
  createdAt: Date;
  autorNome: string;
  resposta: string | null;
  respondidoPorNome: string | null;
  respondidoEm: Date | null;
};

export type TramitacaoEscopo = {
  tenant_id?: string | undefined;
  company_id?: string | undefined;
  ordemServico_id?: string | undefined;
};

/**
 * Tramitação da OS com a empresa: ciência, apontamentos, comentários e o histórico.
 * O histórico só recebe inserções — não há método para alterar ou apagar evento.
 */
export interface IOrdemServicoTramitacaoRepository {
  findInfo(ordemServico_id: string): Promise<OrdemServicoTramitacaoInfo | null>;
  listEventos(ordemServico_id: string): Promise<OrdemServicoEventoItem[]>;
  listContestacoes(ordemServico_id: string): Promise<OrdemServicoContestacaoItem[]>;
  findContestacao(id: string): Promise<OrdemServicoContestacaoItem | null>;
  /** Primeira abertura da OS pela empresa (desde a última emissão). false se já estava registrada. */
  registrarVisualizacao(data: { ordemServico_id: string; autor: TramitacaoAutor; now: Date }): Promise<boolean>;
  /** Grava a ciência (uma vez por emissão) e avisa a fiscalização. false se já estava ciente. */
  registrarCiencia(data: { ordemServico_id: string; autor: TramitacaoAutor; now: Date }): Promise<boolean>;
  criarContestacao(data: { ordemServico_id: string; autor: TramitacaoAutor; texto: string }): Promise<void>;
  /** Comentário no histórico; avisa o outro lado (empresa → fiscalização e vice-versa). */
  comentar(data: { ordemServico_id: string; autor: TramitacaoAutor; texto: string; daEmpresa: boolean }): Promise<void>;
  /** Decide um apontamento aberto (uma vez só). false se ele já tinha decisão. */
  responderContestacao(data: {
    contestacao_id: string;
    autor: TramitacaoAutor;
    decisao: "ACATADA" | "RECUSADA";
    resposta: string;
    now: Date;
  }): Promise<boolean>;
  /** Mudança de status da OS (finalizar, cancelar, reativar) no histórico. */
  registrarStatus(data: { ordemServico_id: string; autor: TramitacaoAutor; texto: string }): Promise<void>;
  /**
   * Registra no histórico (uma vez por emissão) as OS que passaram do prazo sem ciência, com a
   * data do próprio vencimento, e avisa a fiscalização. Devolve quantas foram registradas.
   */
  registrarPrazosVencidos(escopo: TramitacaoEscopo & { now: Date }): Promise<number>;
  /** OS ativas da empresa aguardando ciência (no prazo ou vencidas). */
  listAguardandoCiencia(escopo: { tenant_id: string; company_id: string }): Promise<OrdemServicoTramitacaoInfo[]>;
  /** Se a empresa tem alguma OS ativa com o prazo de ciência vencido. */
  hasCienciaVencida(escopo: { tenant_id: string; company_id: string; now: Date }): Promise<boolean>;
  /** Se a empresa já abriu, deu ciência, apontou ou comentou: aí a OS não pode mais ser excluída. */
  hasInteracaoEmpresa(ordemServico_id: string): Promise<boolean>;
}
