import { DomainError } from "../../../domain/errors/DomainError.js";
import {
  validateMedicaoQuantidades,
  validateOrcamentoChange,
  type OrcamentoItemInput,
} from "../../../domain/medicao/medicao-calc.js";
import {
  buildPlanilhaMedicao,
  parsePlanilhaMedicao,
  type ItemPlanilhaCompleto,
} from "../../../domain/medicao/planilha-medicao.js";
import type {
  IMedicaoRepository,
  MedicaoAutor,
  MedicaoDadosInput,
  MedicaoDocumentData,
  MedicaoOsContext,
  MedicaoResumo,
  PlanilhaOs,
} from "../../../domain/repositories/IMedicaoRepository.js";
import { Prisma } from "../../../generated/prisma/client.js";
import type { TransactionClient } from "../../../generated/prisma/internal/prismaNamespace.js";
import { prisma } from "../../prisma/prisma.js";

const ITEM_SELECT = {
  id: true,
  ordem: true,
  codigo: true,
  descricao: true,
  unidade: true,
  quantidade: true,
  precoUnitario: true,
} as const;

const MEDICAO_SELECT = {
  id: true,
  ordemServico_id: true,
  numero: true,
  status: true,
  periodoInicio: true,
  periodoFim: true,
  observacao: true,
  createdAt: true,
  criadoPorNome: true,
  fechadaEm: true,
  fechadaPorNome: true,
  reabertaEm: true,
  reabertaPorNome: true,
  itens: { select: { item_id: true, quantidade: true } },
} as const;

// DomainError lançado dentro da transação segue como está; o resto vira DomainError com contexto
function rethrow(error: unknown, contexto: string): never {
  if (error instanceof DomainError) throw error;
  if ((error as { code?: string } | null)?.code === "P2002") {
    throw new DomainError("There is already a draft medição for this ordem de serviço");
  }
  throw new DomainError(`${contexto}: ${error}`);
}

// Trava a OS até o fim da transação: as escritas de orçamento e medição da mesma OS ficam em fila
async function travarOs(tx: TransactionClient, ordemServico_id: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "OrdemServico" WHERE "id" = ${ordemServico_id} FOR UPDATE`;
  if (rows.length === 0) throw new DomainError("OrdemServico not found");
}

async function loadPlanilha(tx: TransactionClient | typeof prisma, ordemServico_id: string): Promise<PlanilhaOs> {
  const [itens, medicoes] = await Promise.all([
    tx.ordemServicoItem.findMany({ where: { ordemServico_id }, orderBy: { ordem: "asc" }, select: ITEM_SELECT }),
    tx.medicao.findMany({ where: { ordemServico_id }, orderBy: { numero: "asc" }, select: MEDICAO_SELECT }),
  ]);
  return { itens, medicoes };
}

/** Soma por item das medições fechadas, opcionalmente só as de número menor que `antesDe`. */
function somaFechadas(medicoes: MedicaoResumo[], antesDe = Infinity): Map<string, number> {
  const soma = new Map<string, number>();
  for (const medicao of medicoes) {
    if (medicao.status !== "FECHADA" || medicao.numero >= antesDe) continue;
    for (const linha of medicao.itens) soma.set(linha.item_id, (soma.get(linha.item_id) ?? 0) + linha.quantidade);
  }
  return soma;
}

async function loadMedicaoNaTransacao(tx: TransactionClient, medicao_id: string) {
  const medicao = await tx.medicao.findUnique({ where: { id: medicao_id }, select: { ordemServico_id: true } });
  if (!medicao) throw new DomainError("Medição not found");
  await travarOs(tx, medicao.ordemServico_id);
  const planilha = await loadPlanilha(tx, medicao.ordemServico_id);
  const atual = planilha.medicoes.find((m) => m.id === medicao_id);
  if (!atual) throw new DomainError("Medição not found");
  return { planilha, atual };
}

function assertRascunho(medicao: MedicaoResumo) {
  if (medicao.status !== "RASCUNHO") throw new DomainError("Only a draft medição can be changed");
}

function validarDados(planilha: PlanilhaOs, dados: MedicaoDadosInput) {
  validateMedicaoQuantidades({
    itens: planilha.itens,
    medidoFechado: somaFechadas(planilha.medicoes),
    linhas: dados.linhas,
  });
}

function medicaoData(dados: MedicaoDadosInput) {
  return { periodoInicio: dados.periodoInicio, periodoFim: dados.periodoFim, observacao: dados.observacao };
}

export class PrismaMedicaoRepository implements IMedicaoRepository {
  async findOsContext(ordemServico_id: string): Promise<MedicaoOsContext | null> {
    try {
      const row = await prisma.ordemServico.findUnique({
        where: { id: ordemServico_id },
        select: {
          id: true,
          numero: true,
          tenant_id: true,
          status: true,
          totalComBdi: true,
          valor: true,
          dataInicio: true,
          lote: { select: { desconto: true } },
          empenho: { select: { contrato: { select: { company_id: true } } } },
        },
      });
      if (!row) return null;
      const { lote, empenho, ...os } = row;
      return { ...os, company_id: empenho.contrato.company_id, descontoLote: lote?.desconto ?? 0 };
    } catch (error) {
      rethrow(error, "Error finding ordem de serviço");
    }
  }

  async findOrdemServicoIdDaMedicao(medicao_id: string): Promise<string | null> {
    try {
      const row = await prisma.medicao.findUnique({ where: { id: medicao_id }, select: { ordemServico_id: true } });
      return row?.ordemServico_id ?? null;
    } catch (error) {
      rethrow(error, "Error finding medição");
    }
  }

  async getPlanilha(ordemServico_id: string): Promise<PlanilhaOs> {
    try {
      return await loadPlanilha(prisma, ordemServico_id);
    } catch (error) {
      rethrow(error, "Error loading the budget");
    }
  }

  async hasMedicaoFechada(ordemServico_id: string): Promise<boolean> {
    try {
      return (await prisma.medicao.count({ where: { ordemServico_id, status: "FECHADA" } })) > 0;
    } catch (error) {
      rethrow(error, "Error checking medições");
    }
  }

  async saveOrcamento({ ordemServico_id, itens }: { ordemServico_id: string; itens: OrcamentoItemInput[] }) {
    try {
      await prisma.$transaction(async (tx) => {
        await travarOs(tx, ordemServico_id);
        const planilha = await loadPlanilha(tx, ordemServico_id);
        validateOrcamentoChange({ atuais: planilha.itens, novos: itens, medidoFechado: somaFechadas(planilha.medicoes) });

        // Itens que saem levam as linhas do rascunho em cascata (os de medição fechada já foram barrados)
        const mantidos = new Set(itens.flatMap((i) => (i.id ? [i.id] : [])));
        const removidos = planilha.itens.filter((i) => !mantidos.has(i.id)).map((i) => i.id);
        if (removidos.length > 0) {
          await tx.ordemServicoItem.deleteMany({ where: { id: { in: removidos } } });
        }

        const now = new Date();
        for (const [index, item] of itens.entries()) {
          const data = {
            ordem: index + 1,
            codigo: item.codigo,
            descricao: item.descricao,
            unidade: item.unidade,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
          };
          if (item.id) {
            await tx.ordemServicoItem.update({ where: { id: item.id }, data: { ...data, updatedAt: now } });
          } else {
            await tx.ordemServicoItem.create({ data: { ...data, ordemServico_id } });
          }
        }
      });
    } catch (error) {
      rethrow(error, "Error saving the budget");
    }
  }

  async createMedicao({
    ordemServico_id,
    dados,
    autor,
  }: {
    ordemServico_id: string;
    dados: MedicaoDadosInput;
    autor: MedicaoAutor;
  }): Promise<string> {
    try {
      return await prisma.$transaction(async (tx) => {
        await travarOs(tx, ordemServico_id);
        const planilha = await loadPlanilha(tx, ordemServico_id);
        if (planilha.itens.length === 0) throw new DomainError("This ordem de serviço has no budget yet");
        if (planilha.medicoes.some((m) => m.status === "RASCUNHO")) {
          throw new DomainError("There is already a draft medição for this ordem de serviço");
        }
        validarDados(planilha, dados);

        const numero = (planilha.medicoes.at(-1)?.numero ?? 0) + 1;
        const created = await tx.medicao.create({
          data: {
            ...medicaoData(dados),
            numero,
            ordemServico_id,
            criadoPor_id: autor.id,
            criadoPorNome: autor.nome,
            itens: { create: dados.linhas.map((l) => ({ item_id: l.item_id, quantidade: l.quantidade })) },
          },
          select: { id: true },
        });
        return created.id;
      });
    } catch (error) {
      rethrow(error, "Error creating medição");
    }
  }

  async updateMedicao({ medicao_id, dados }: { medicao_id: string; dados: MedicaoDadosInput }) {
    try {
      await prisma.$transaction(async (tx) => {
        const { planilha, atual } = await loadMedicaoNaTransacao(tx, medicao_id);
        assertRascunho(atual);
        validarDados(planilha, dados);

        await tx.medicaoItem.deleteMany({ where: { medicao_id } });
        await tx.medicao.update({
          where: { id: medicao_id },
          data: {
            ...medicaoData(dados),
            updatedAt: new Date(),
            itens: { create: dados.linhas.map((l) => ({ item_id: l.item_id, quantidade: l.quantidade })) },
          },
        });
      });
    } catch (error) {
      rethrow(error, "Error updating medição");
    }
  }

  async deleteMedicao(medicao_id: string) {
    try {
      await prisma.$transaction(async (tx) => {
        const { atual } = await loadMedicaoNaTransacao(tx, medicao_id);
        assertRascunho(atual);
        await tx.medicao.delete({ where: { id: medicao_id } });
      });
    } catch (error) {
      rethrow(error, "Error deleting medição");
    }
  }

  async fecharMedicao({ medicao_id, autor, now }: { medicao_id: string; autor: MedicaoAutor; now: Date }) {
    try {
      await prisma.$transaction(async (tx) => {
        const { planilha, atual } = await loadMedicaoNaTransacao(tx, medicao_id);
        assertRascunho(atual);
        if (atual.itens.length === 0) throw new DomainError("The medição has no measured quantity");
        // O orçamento pode ter mudado depois que o rascunho foi lançado
        validateMedicaoQuantidades({
          itens: planilha.itens,
          medidoFechado: somaFechadas(planilha.medicoes),
          linhas: atual.itens,
        });

        const os = await tx.ordemServico.findUniqueOrThrow({
          where: { id: atual.ordemServico_id },
          select: { fiscalTecnico: { select: { nome: true } }, fiscalAdministrativo: { select: { nome: true } } },
        });
        const snapshot = buildPlanilhaMedicao({
          itens: planilha.itens,
          anterior: somaFechadas(planilha.medicoes),
          esta: new Map(atual.itens.map((l) => [l.item_id, l.quantidade])),
          fiscais: {
            tecnico: os.fiscalTecnico?.nome ?? null,
            administrativo: os.fiscalAdministrativo?.nome ?? null,
          },
        });

        await tx.medicao.update({
          where: { id: medicao_id },
          data: {
            status: "FECHADA",
            fechadaEm: now,
            fechadaPor_id: autor.id,
            fechadaPorNome: autor.nome,
            planilhaFechamento: snapshot,
            updatedAt: now,
          },
        });
      });
    } catch (error) {
      rethrow(error, "Error closing medição");
    }
  }

  async reabrirMedicao({ medicao_id, autor, now }: { medicao_id: string; autor: MedicaoAutor; now: Date }) {
    try {
      await prisma.$transaction(async (tx) => {
        const { planilha, atual } = await loadMedicaoNaTransacao(tx, medicao_id);
        if (atual.status !== "FECHADA") throw new DomainError("Only a closed medição can be reopened");
        if (planilha.medicoes.some((m) => m.status === "RASCUNHO")) {
          throw new DomainError("Finish or delete the draft medição before reopening another one");
        }
        if (planilha.medicoes.at(-1)?.id !== atual.id) {
          throw new DomainError("Only the last closed medição can be reopened");
        }
        await tx.medicao.update({
          where: { id: medicao_id },
          data: {
            status: "RASCUNHO",
            fechadaEm: null,
            fechadaPor_id: null,
            fechadaPorNome: null,
            planilhaFechamento: Prisma.DbNull,
            reabertaEm: now,
            reabertaPorNome: autor.nome,
            updatedAt: now,
          },
        });
      });
    } catch (error) {
      rethrow(error, "Error reopening medição");
    }
  }

  async getDocumentData(medicao_id: string): Promise<MedicaoDocumentData | null> {
    try {
      const row = await prisma.medicao.findUnique({
        where: { id: medicao_id },
        select: {
          ...MEDICAO_SELECT,
          planilhaFechamento: true,
          ordemServico: {
            select: {
              id: true,
              numero: true,
              tenant_id: true,
              descricaoProblema: true,
              obra: {
                select: { nome: true, identificacaoPatrimonial: true, idPatrimonialCompleto: true, apelido: true },
              },
              lote: { select: { numero: true, nome: true } },
              fiscalTecnico: { select: { nome: true } },
              fiscalAdministrativo: { select: { nome: true } },
              tenant: { select: { city: true } },
              empenho: {
                select: {
                  contrato: {
                    select: {
                      identificador: true,
                      ePag: true,
                      company_id: true,
                      company: { select: { name: true, cnpj: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!row) return null;
      const { ordemServico: os, planilhaFechamento, ...medicao } = row;

      let planilha = medicao.status === "FECHADA" ? parsePlanilhaMedicao(planilhaFechamento) : null;
      if (!planilha) {
        // Rascunho: orçamento atual, com as fechadas de antes como acumulado anterior
        const atual = await loadPlanilha(prisma, medicao.ordemServico_id);
        const itens: ItemPlanilhaCompleto[] = atual.itens;
        planilha = buildPlanilhaMedicao({
          itens,
          anterior: somaFechadas(atual.medicoes, medicao.numero),
          esta: new Map(medicao.itens.map((l) => [l.item_id, l.quantidade])),
          fiscais: { tecnico: os.fiscalTecnico?.nome ?? null, administrativo: os.fiscalAdministrativo?.nome ?? null },
        });
      }

      return {
        medicao,
        planilha,
        ordemServico: { id: os.id, numero: os.numero, tenant_id: os.tenant_id, descricao: os.descricaoProblema },
        contrato: os.empenho.contrato,
        obra: os.obra,
        lote: os.lote,
        tenant: os.tenant,
      };
    } catch (error) {
      rethrow(error, "Error getting medição document data");
    }
  }
}
