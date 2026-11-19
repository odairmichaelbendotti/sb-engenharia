import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import type { AlteracaoDados, FiscalDados } from "../../../domain/fiscalizacao.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { prisma } from "../../prisma/prisma.js";
import { inserirEvento } from "./tramitacao-tx.js";

type Db = Prisma.TransactionClient;
type Tipo = "TECNICO" | "ADMINISTRATIVO";
const campoFiscal = (tipo: Tipo) => tipo === "TECNICO" ? "fiscalTecnico_id" : "fiscalAdministrativo_id";
const USUARIO_SELECT = { id: true, name: true, email: true, ramal: true, role: true, tenant_id: true, approved: true, company_id: true } as const;
const usuarioElegivel = (tenant_id: string) => ({ tenant_id, approved: true, role: { not: "EMPRESA" as const }, company_id: null });
const contatos = (user: { name: string; email: string; ramal: string }) => ({ nome: user.name, email: user.email.trim().toLowerCase(), ramal: user.ramal });

async function lock(db: Db, tenant_id: string) {
  const rows = await db.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Tenant" WHERE "id" = ${tenant_id} FOR UPDATE`;
  if (!rows.length) throw new DomainError("Unidade não encontrada.");
}

async function historico(db: Db, user: AuthenticatedUser, tenant_id: string, alteracao: AlteracaoDados,
  acao: string, dados: Prisma.InputJsonObject, contrato_id: string | null, fiscal_id: string | null) {
  await db.fiscalizacaoHistorico.create({ data: {
    tenant_id, contrato_id, fiscal_id, acao, ...alteracao, dados,
    autor_id: user.id, autorNome: user.name, autorPerfil: user.role,
  } });
}

async function contratoAtivo(db: Db, contrato_id: string, tenant_id: string) {
  const contrato = await db.contrato.findFirst({ where: { id: contrato_id, tenant_id, status: "ATIVO" } });
  if (!contrato) throw new DomainError("Contrato ativo não encontrado nesta unidade.");
  return contrato;
}

export class PrismaFiscalizacaoRepository {
  async list(tenant_id: string, user: AuthenticatedUser) {
    const [unidades, fiscais, contratos, ordens, historico, usuarios] = await Promise.all([
      prisma.tenant.findMany({ where: user.role === "PLATFORM_ADMIN" ? {} : { id: tenant_id }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.fiscal.findMany({ where: { tenant_id }, orderBy: { nome: "asc" }, include: { user: { select: USUARIO_SELECT }, vinculos: {
        include: { contrato: { select: { id: true, identificador: true } } }, orderBy: { inicio: "desc" },
      } } }),
      prisma.contrato.findMany({ where: { tenant_id }, select: { id: true, identificador: true, status: true }, orderBy: { identificador: "asc" } }),
      prisma.ordemServico.findMany({ where: { tenant_id }, select: {
        id: true, numero: true, status: true, fiscalTecnico_id: true, fiscalAdministrativo_id: true,
        empenho: { select: { contrato_id: true } },
      }, orderBy: { numero: "asc" } }),
      prisma.fiscalizacaoHistorico.findMany({ where: { tenant_id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
      prisma.user.findMany({ where: usuarioElegivel(tenant_id), select: USUARIO_SELECT, orderBy: [{ name: "asc" }, { email: "asc" }] }),
    ]);
    return { tenant_id, unidades, contratos, ordens, historico,
      usuarios: usuarios.map(({ id, name, email, ramal, role }) => ({ id, name, email, ramal, role })),
      fiscais: fiscais.map(({ user: pessoa, ...fiscal }) => {
        const usuarioDisponivel = !!pessoa && pessoa.tenant_id === tenant_id && pessoa.approved && pessoa.role !== "EMPRESA" && !pessoa.company_id;
        return { ...fiscal, ...(usuarioDisponivel ? contatos(pessoa) : {}), usuarioDisponivel };
      }),
    };
  }

  async save(user: AuthenticatedUser, tenant_id: string, id: string | null, dados: FiscalDados, alteracao: AlteracaoDados) {
    return prisma.$transaction(async (db) => {
      await lock(db, tenant_id);
      const anterior = id ? await db.fiscal.findFirst({ where: { id, tenant_id } }) : null;
      if (id && !anterior) throw new DomainError("Fiscal não encontrado nesta unidade.");
      if (anterior?.user_id && dados.user_id !== anterior.user_id) throw new DomainError("O usuário de um fiscal já vinculado não pode ser trocado. Utilize a substituição de fiscais nas OS.");
      // Na inativação de um cadastro antigo/indisponível, preserva os dados
      // históricos sem precisar associar outra pessoa apenas para encerrá-lo.
      const pessoa = dados.user_id ? await db.user.findFirst({ where: { id: dados.user_id, ...usuarioElegivel(tenant_id) }, select: USUARIO_SELECT }) : null;
      if (!pessoa && (dados.ativo || !anterior || dados.user_id !== anterior.user_id)) {
        throw new DomainError("Selecione um usuário aprovado e interno desta unidade.");
      }
      const cadastro = { ...(pessoa ? contatos(pessoa) : { nome: anterior!.nome, email: anterior!.email, ramal: anterior!.ramal }),
        user_id: dados.user_id, ativo: dados.ativo };
      const repetido = await db.fiscal.findFirst({ where: { tenant_id, ...(id ? { id: { not: id } } : {}),
        OR: [{ email: cadastro.email }, ...(dados.user_id ? [{ user_id: dados.user_id }] : [])],
      } });
      if (repetido) throw new DomainError("Este usuário já possui cadastro de fiscal nesta unidade. Utilize o cadastro existente.");
      const vinculos = anterior ? await db.fiscalContrato.findMany({ where: { fiscal_id: anterior.id, ativo: true } }) : [];
      if (!dados.ativo && vinculos.length) {
        if (vinculos.some((v) => alteracao.vigencia < new Date(v.inicio.toISOString().slice(0, 10)))) {
          throw new DomainError("A inativação não pode anteceder o início de uma designação ativa.");
        }
        const ids = vinculos.map((v) => v.id);
        const count = await db.ordemServico.count({ where: { tenant_id, status: "ATIVO", OR: [
          { fiscalTecnico_id: { in: ids } }, { fiscalAdministrativo_id: { in: ids } },
        ] } });
        if (count) throw new DomainError("Substitua o fiscal nas OS em andamento antes de inativá-lo.");
      }
      const fiscal = anterior
        ? await db.fiscal.update({ where: { id: anterior.id }, data: cadastro })
        : await db.fiscal.create({ data: { tenant_id, ...cadastro } });
      // Os vínculos encerrados guardam os dados de quando a pessoa foi designada.
      if (anterior) await db.fiscalContrato.updateMany({ where: { fiscal_id: fiscal.id, ativo: true }, data: {
        nome: cadastro.nome, email: cadastro.email, ramal: cadastro.ramal,
        ...(!dados.ativo ? { ativo: false, fim: alteracao.vigencia } : {}),
      } });
      await historico(db, user, tenant_id, alteracao, anterior ? "FISCAL_ATUALIZADO" : "FISCAL_CADASTRADO",
        { anterior: anterior ? { nome: anterior.nome, ramal: anterior.ramal, email: anterior.email, ativo: anterior.ativo, user_id: anterior.user_id } : null,
          atual: cadastro, vinculos: vinculos.map((v) => v.id) }, null, fiscal.id);
      return fiscal;
    });
  }

  async vincular(user: AuthenticatedUser, tenant_id: string, fiscal_id: string, contrato_id: string, tipo: Tipo, alteracao: AlteracaoDados) {
    return prisma.$transaction(async (db) => {
      await lock(db, tenant_id);
      await contratoAtivo(db, contrato_id, tenant_id);
      const fiscal = await db.fiscal.findFirst({ where: { id: fiscal_id, tenant_id, ativo: true, user: usuarioElegivel(tenant_id) }, include: { user: { select: USUARIO_SELECT } } });
      if (!fiscal?.user) throw new DomainError("Selecione um fiscal ativo vinculado a um usuário aprovado desta unidade.");
      if (await db.fiscalContrato.findFirst({ where: { contrato_id, fiscal_id, tipo, ativo: true } })) {
        throw new DomainError("O fiscal já possui uma designação ativa deste tipo no contrato.");
      }
      const vinculo = await db.fiscalContrato.create({ data: {
        contrato_id, fiscal_id, tipo, ...contatos(fiscal.user), inicio: alteracao.vigencia,
      } });
      await historico(db, user, tenant_id, alteracao, "DESIGNACAO_CRIADA",
        { vinculo_id: vinculo.id, nome: fiscal.user.name, user_id: fiscal.user_id, tipo }, contrato_id, fiscal_id);
      return vinculo;
    });
  }

  async encerrar(user: AuthenticatedUser, tenant_id: string, id: string, alteracao: AlteracaoDados) {
    return prisma.$transaction(async (db) => {
      await lock(db, tenant_id);
      const vinculo = await db.fiscalContrato.findFirst({ where: { id, ativo: true, contrato: { tenant_id } } });
      if (!vinculo) throw new DomainError("Designação ativa não encontrada nesta unidade.");
      if (alteracao.vigencia < new Date(vinculo.inicio.toISOString().slice(0, 10))) throw new DomainError("O encerramento não pode ser anterior ao início da designação.");
      if (await db.ordemServico.count({ where: { tenant_id, status: "ATIVO", OR: [{ fiscalTecnico_id: id }, { fiscalAdministrativo_id: id }] } })) {
        throw new DomainError("Substitua o responsável nas OS em andamento antes de encerrar a designação.");
      }
      await db.fiscalContrato.update({ where: { id }, data: { ativo: false, fim: alteracao.vigencia } });
      await historico(db, user, tenant_id, alteracao, "DESIGNACAO_ENCERRADA",
        { vinculo_id: id, nome: vinculo.nome, tipo: vinculo.tipo }, vinculo.contrato_id, vinculo.fiscal_id);
    });
  }

  async substituir(user: AuthenticatedUser, tenant_id: string, contrato_id: string, tipo: Tipo,
    anterior_id: string | null, novo_id: string, ordens: string[], alteracao: AlteracaoDados) {
    return prisma.$transaction(async (db) => {
      await lock(db, tenant_id);
      await contratoAtivo(db, contrato_id, tenant_id);
      const novo = await db.fiscalContrato.findFirst({ where: { id: novo_id, contrato_id, tipo, ativo: true, fiscal: { ativo: true, tenant_id, user: usuarioElegivel(tenant_id) } } });
      if (!novo) throw new DomainError("Selecione uma designação ativa do mesmo contrato e tipo.");
      if (anterior_id === novo_id) throw new DomainError("Selecione um responsável diferente do atual.");
      const anterior = anterior_id ? await db.fiscalContrato.findFirst({ where: { id: anterior_id, contrato_id, tipo } }) : null;
      if (anterior_id && !anterior) throw new DomainError("Responsável anterior não pertence ao contrato e tipo selecionados.");
      if (alteracao.vigencia < new Date(novo.inicio.toISOString().slice(0, 10))) throw new DomainError("A substituição não pode anteceder a designação do novo fiscal.");
      const campo = campoFiscal(tipo);
      const selecionadas = await db.ordemServico.findMany({ where: {
        id: { in: ordens }, tenant_id, status: "ATIVO", empenho: { contrato_id }, [campo]: anterior_id,
      }, select: { id: true, numero: true } });
      if (selecionadas.length !== ordens.length) throw new DomainError("A seleção de OS mudou ou contém registros de outro contrato. Atualize e revise a substituição.");
      const resultado = await db.ordemServico.updateMany({ where: {
        id: { in: ordens }, tenant_id, status: "ATIVO", empenho: { contrato_id }, [campo]: anterior_id,
      }, data: { [campo]: novo.id, updatedAt: new Date() } });
      if (resultado.count !== ordens.length) throw new DomainError("Uma OS foi alterada durante a operação. Atualize e tente novamente.");
      const texto = `Fiscal ${tipo === "TECNICO" ? "técnico" : "administrativo"}: ${anterior?.nome ?? "sem responsável"} → ${novo.nome}. Vigência: ${alteracao.vigencia.toISOString().slice(0, 10)}. Motivo: ${alteracao.motivo}`;
      for (const os of selecionadas) await inserirEvento(db, { ordemServico_id: os.id, tipo: "COMENTARIO", texto,
        autor: { id: user.id, nome: user.name, perfil: user.role, empresa: null } });
      await historico(db, user, tenant_id, alteracao, "RESPONSAVEL_SUBSTITUIDO", {
        tipo, anterior_id, novo_id, anterior: anterior?.nome ?? null, novo: novo.nome, ordens: selecionadas,
      }, contrato_id, novo.fiscal_id);
      return { alteradas: resultado.count };
    });
  }

  async updateUserRamal(user: AuthenticatedUser, tenant_id: string, user_id: string, ramal: string) {
    return prisma.$transaction(async (db) => {
      await lock(db, tenant_id);
      const pessoa = await db.user.findFirst({ where: { id: user_id, ...usuarioElegivel(tenant_id) }, select: USUARIO_SELECT });
      if (!pessoa) throw new DomainError("Usuário aprovado não encontrado nesta unidade.");
      await db.user.update({ where: { id: user_id }, data: { ramal } });
      const fiscais = await db.fiscal.findMany({ where: { tenant_id, user_id } });
      for (const fiscal of fiscais) {
        const atual = { ...contatos(pessoa), ramal, ativo: fiscal.ativo, user_id };
        await db.fiscal.update({ where: { id: fiscal.id }, data: atual });
        await db.fiscalContrato.updateMany({ where: { fiscal_id: fiscal.id, ativo: true }, data: { ...contatos(pessoa), ramal } });
        const agora = new Date();
        await historico(db, user, tenant_id, { vigencia: agora, motivo: "Ramal atualizado no cadastro do usuário da unidade." }, "FISCAL_ATUALIZADO", {
          anterior: { nome: fiscal.nome, email: fiscal.email, ramal: fiscal.ramal, ativo: fiscal.ativo, user_id }, atual,
        }, null, fiscal.id);
      }
      return { id: pessoa.id, name: pessoa.name, email: pessoa.email, ramal };
    });
  }
}
