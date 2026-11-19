import type { AuthenticatedUser } from "../@types/AuthenticatedUser.js";
import { DomainError } from "./errors/DomainError.js";
import { DomainAccessPolicy } from "./polices/DomainAccessPolicy.js";

export function fiscalizacaoEscopo(user: AuthenticatedUser, tenant: unknown) {
  if (!new DomainAccessPolicy().canDo(user.role, "manageFiscalizacao")) {
    throw new DomainError("Você não tem permissão para gerenciar a fiscalização.");
  }
  const tenant_id = typeof tenant === "string" && tenant ? tenant : user.tenant_id;
  if (user.role !== "PLATFORM_ADMIN" && tenant_id !== user.tenant_id) {
    throw new DomainError("A fiscalização só pode ser gerenciada na sua unidade.");
  }
  return tenant_id;
}

function texto(value: unknown, campo: string, max = 200) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new DomainError(`Informe ${campo} (até ${max} caracteres).`);
  }
  return value.trim();
}

export function dadosFiscal(body: Record<string, unknown>) {
  const email = texto(body.email, "o e-mail").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DomainError("Informe um e-mail válido.");
  if (typeof body.ativo !== "boolean") throw new DomainError("Situação do fiscal inválida.");
  return { nome: texto(body.nome, "o nome"), ramal: texto(body.ramal, "o ramal", 40), email, ativo: body.ativo };
}

export function dadosAlteracao(body: Record<string, unknown>) {
  const motivo = texto(body.motivo, "o motivo", 2000);
  if (typeof body.vigencia !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.vigencia)) {
    throw new DomainError("Informe a data de início da alteração.");
  }
  const vigencia = new Date(`${body.vigencia}T00:00:00.000Z`);
  if (!Number.isFinite(vigencia.getTime()) || vigencia.toISOString().slice(0, 10) !== body.vigencia) {
    throw new DomainError("Data de vigência inválida.");
  }
  // As alterações são efetivadas agora; não há agendamento implícito de mudanças futuras.
  const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
  if (body.vigencia > hoje) throw new DomainError("A vigência não pode ser futura.");
  return { motivo, vigencia };
}

export function tipoFiscal(value: unknown) {
  if (value !== "TECNICO" && value !== "ADMINISTRATIVO") throw new DomainError("Tipo de fiscalização inválido.");
  return value;
}

export function idsOrdens(value: unknown): string[] {
  if (!Array.isArray(value) || !value.length || value.length > 500 || value.some((id) => typeof id !== "string" || !id)) {
    throw new DomainError("Selecione de 1 a 500 ordens de serviço.");
  }
  if (new Set(value).size !== value.length) throw new DomainError("A seleção de OS contém duplicações.");
  return value;
}

export type FiscalDados = ReturnType<typeof dadosFiscal>;
export type AlteracaoDados = ReturnType<typeof dadosAlteracao>;
