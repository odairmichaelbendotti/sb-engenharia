import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { normalizeMultilineText } from "../../../domain/normalization/text-normalizers.js";
import type {
  IOrdemServicoTramitacaoRepository,
  OrdemServicoTramitacaoInfo,
  TramitacaoAutor,
} from "../../../domain/repositories/IOrdemServicoTramitacaoRepository.js";
import { TRAMITACAO_TEXTO_MAX, type SituacaoCiencia } from "../../../domain/tramitacao/ciencia.js";

/**
 * Carrega a OS e confere o acesso: a organização só vê as próprias OS (PLATFORM_ADMIN vê todas)
 * e a empresa só as dos próprios contratos. OS de fora do escopo responde como inexistente.
 */
export async function loadInfoComAcesso(
  repository: IOrdemServicoTramitacaoRepository,
  ordemServico_id: string,
  user: AuthenticatedUser,
): Promise<OrdemServicoTramitacaoInfo> {
  if (user.role === "EMPRESA" && !user.company_id) {
    throw new DomainError("This user is not linked to a company");
  }
  const info = await repository.findInfo(ordemServico_id);
  const foraDoTenant = user.role !== "PLATFORM_ADMIN" && info?.tenant_id !== user.tenant_id;
  const foraDaEmpresa = user.role === "EMPRESA" && info?.company_id !== user.company_id;
  if (!info || foraDoTenant || foraDaEmpresa) {
    throw new DomainError("OrdemServico not found");
  }
  return info;
}

/** Autor copiado para o histórico; o da empresa leva a razão social. */
export function autorDe(user: AuthenticatedUser, empresa: string | null = null): TramitacaoAutor {
  return {
    id: user.id,
    nome: user.name,
    perfil: user.role,
    empresa: user.role === "EMPRESA" ? empresa : null,
  };
}

export function situacaoDe(info: OrdemServicoTramitacaoInfo): SituacaoCiencia {
  return {
    status: info.status,
    emitidaEm: info.emitidaEm,
    cienciaPrazoAte: info.cienciaPrazoAte,
    cienciaDispensada: info.cienciaDispensada,
    cienteEm: info.cienteEm,
    contestacoesAbertas: info.contestacoesAbertas,
  };
}

/** Texto de comentário, apontamento ou resposta: limpo, obrigatório e com tamanho máximo. */
export function normalizeTexto(texto: unknown): string {
  const normalized = typeof texto === "string" ? normalizeMultilineText(texto) : "";
  if (!normalized) throw new DomainError("Texto is required");
  if (normalized.length > TRAMITACAO_TEXTO_MAX) {
    throw new DomainError(`Texto must have at most ${TRAMITACAO_TEXTO_MAX} characters`);
  }
  return normalized;
}
