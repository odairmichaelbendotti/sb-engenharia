export type NotificacaoTipo =
  | "OS_EMITIDA"
  | "OS_REEMITIDA"
  | "OS_CIENTE"
  | "OS_PRAZO_VENCIDO"
  | "OS_CONTESTACAO"
  | "OS_CONTESTACAO_RESPONDIDA"
  | "OS_COMENTARIO";

export type NotificacaoItem = {
  id: string;
  tipo: NotificacaoTipo;
  titulo: string;
  mensagem: string;
  createdAt: Date;
  ordemServico_id: string | null;
  // Quando este usuário leu; null = não lida
  lidaEm: Date | null;
};

// Quem recebe: os usuários EMPRESA de uma empresa, ou a fiscalização da organização
export type NotificacaoPublico =
  | { destino: "EMPRESA"; tenant_id: string; company_id: string }
  | { destino: "FISCALIZACAO"; tenant_id: string };

export interface INotificacaoRepository {
  /** Mais recentes primeiro, com a leitura do usuário. */
  list(data: { publico: NotificacaoPublico; user_id: string; limit: number }): Promise<NotificacaoItem[]>;
  countNaoLidas(data: { publico: NotificacaoPublico; user_id: string }): Promise<number>;
  /** Marca como lida pelo usuário; só vale para notificação do público dele. */
  marcarLida(data: { publico: NotificacaoPublico; user_id: string; notificacao_id: string }): Promise<void>;
  marcarTodasLidas(data: { publico: NotificacaoPublico; user_id: string }): Promise<void>;
}
