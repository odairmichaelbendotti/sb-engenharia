import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { OrdemServicoEntity, type OrdemServicoType } from "../../../domain/entities/OrdemServico.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";
import { normalizeInput, ORDEM_SERVICO_RULES } from "../../../domain/normalization/input-rules.js";
import { OrdemServicoEmpenhosValidator } from "./OrdemServicoEmpenhosValidator.js";
import { normalizeFreeText } from "../../../domain/normalization/text-normalizers.js";
import { OrdemServicoDocumentValidator } from "./OrdemServicoDocumentValidator.js";
import { OrdemServicoObraValidator } from "./OrdemServicoObraValidator.js";
import {
  calcularPrazoCiencia,
  houveMudancaNoConteudo,
  isCienciaDispensada,
  type OrdemServicoConteudo,
} from "../../../domain/tramitacao/ciencia.js";
import { autorDe } from "../ordem-servico-tramitacao/tramitacao-access.js";

// Data sem horário, para comparar o que veio do banco com o que veio do formulário
const dayOf = (value: string | Date | null) => (value ? new Date(value).toISOString().slice(0, 10) : null);

type DataCampo = string | Date | null;

// Só os campos que a empresa precisa reconhecer de novo quando mudam (ver houveMudancaNoConteudo)
function conteudoDe(os: Omit<OrdemServicoConteudo, "dataInicio" | "dataPrevisaoTermino" | "dataVistoria" | "dataEmissao"> & {
  dataInicio: DataCampo;
  dataPrevisaoTermino: DataCampo;
  dataVistoria: DataCampo;
  dataEmissao: DataCampo;
}): OrdemServicoConteudo {
  return {
    numero: os.numero,
    empenhos: os.empenhos,
    dataInicio: dayOf(os.dataInicio),
    dataPrevisaoTermino: dayOf(os.dataPrevisaoTermino),
    obra_id: os.obra_id,
    lote_id: os.lote_id,
    setorRequisitante: os.setorRequisitante,
    urgencia: os.urgencia,
    dataVistoria: dayOf(os.dataVistoria),
    descricaoProblema: os.descricaoProblema,
    dataEmissao: dayOf(os.dataEmissao),
    prazoMobilizacaoDias: os.prazoMobilizacaoDias,
    prazoDias: os.prazoDias,
    totalComBdiCentavos: os.totalComBdiCentavos,
    fiscalSetorial: os.fiscalSetorial,
    fiscalTecnico_id: os.fiscalTecnico_id,
    fiscalAdministrativo_id: os.fiscalAdministrativo_id,
    condicoesEspeciais: os.condicoesEspeciais,
  };
}

export class UpdateOrdemServicoUseCase {
  private empenhosValidator: OrdemServicoEmpenhosValidator;
  private obraValidator: OrdemServicoObraValidator;
  private documentValidator: OrdemServicoDocumentValidator;

  constructor(
    private repository: IOrdemServicoRepository,
    empenhoRepository: IEmpenhoRepository,
    obraRepository: IObraRepository,
  ) {
    this.empenhosValidator = new OrdemServicoEmpenhosValidator(empenhoRepository);
    this.obraValidator = new OrdemServicoObraValidator(obraRepository, repository);
    this.documentValidator = new OrdemServicoDocumentValidator(repository);
  }

  async execute({
    ordemServicoId,
    data,
    user,
  }: {
    ordemServicoId: string;
    // obra_id undefined = mantém a obra atual; null = retira a OS da obra
    data: Omit<OrdemServicoType, "tenant_id">;
    user: AuthenticatedUser;
  }) {
    // Padroniza os textos antes de validar, buscar duplicados e gravar
    data = normalizeInput(data, ORDEM_SERVICO_RULES);
    const canEdit = new DomainAccessPolicy().can(user.role, "administrativo", "edit");
    if (!canEdit) {
      throw new DomainError("User is not authorized to perform this action");
    }

    const existing = await this.repository.findById(ordemServicoId);
    if (!existing || existing.tenant_id !== user.tenant_id) {
      throw new DomainError("OrdemServico not found");
    }

    // O número gerado pelo sistema (com sequência) não muda; o das OS antigas ainda pode ser corrigido
    const numero = existing.sequencia !== null ? existing.numero : data.numero || existing.numero;
    if (numero !== existing.numero) {
      const numeroAlreadyExists = await this.repository.verifyNumero(numero, user.tenant_id);
      if (numeroAlreadyExists) {
        throw new DomainError("Numero already exists");
      }
    }

    // Soma dos itens em centavos: com orçamento, é o valor da OS que os empenhos precisam somar
    const valorOrcamento = await this.repository.getValorOrcamento(ordemServicoId);

    // Campo ausente na edição mantém o valor atual; vazio/null limpa
    const keep = <T,>(value: T | undefined, current: T) => (value === undefined ? current : value);
    const day = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : null);

    const ordemServicoEntity = new OrdemServicoEntity({
      numero,
      empenhos: data.empenhos ?? [],
      dataInicio: data.dataInicio || existing.dataInicio?.toISOString() || "",
      dataPrevisaoTermino: data.dataPrevisaoTermino || existing.dataPrevisaoTermino?.toISOString() || "",
      obra_id: data.obra_id === undefined ? existing.obra_id : data.obra_id,
      tenant_id: existing.tenant_id,
      lote_id: keep(data.lote_id, existing.lote_id),
      setorRequisitante: keep(data.setorRequisitante, existing.setorRequisitante),
      urgencia: keep(data.urgencia, existing.urgencia),
      dataVistoria: keep(data.dataVistoria, day(existing.dataVistoria)),
      descricaoProblema: keep(data.descricaoProblema, existing.descricaoProblema),
      dataEmissao: keep(data.dataEmissao, day(existing.dataEmissao)),
      prazoMobilizacaoDias: keep(data.prazoMobilizacaoDias, existing.prazoMobilizacaoDias),
      prazoDias: keep(data.prazoDias, existing.prazoDias),
      // Com orçamento o total com BDI sai dele; só a OS antiga sem orçamento ainda o recebe digitado
      totalComBdi: valorOrcamento === null ? keep(data.totalComBdi, existing.totalComBdi) : existing.totalComBdi,
      fiscalSetorial: keep(data.fiscalSetorial, existing.fiscalSetorial),
      fiscalTecnico_id: keep(data.fiscalTecnico_id, existing.fiscalTecnico_id),
      fiscalAdministrativo_id: keep(data.fiscalAdministrativo_id, existing.fiscalAdministrativo_id),
      condicoesEspeciais: (data.condicoesEspeciais ?? existing.condicoesEspeciais).map((c) => normalizeFreeText(c)),
    });

    // Empenho só sai da OS se nenhuma nota fiscal desta OS foi lançada nele
    const novosIds = new Set(ordemServicoEntity.empenhos.map((e) => e.empenho_id));
    const atuais = await this.repository.listVinculos(ordemServicoId);
    for (const removido of atuais.filter((vinculo) => !novosIds.has(vinculo.empenho_id))) {
      if (await this.repository.hasInvoicesForEmpenho(ordemServicoId, removido.empenho_id)) {
        throw new DomainError(
          `Não é possível remover o empenho ${removido.numero}: já existem notas fiscais desta OS lançadas nele.`,
        );
      }
    }

    const vinculos = await this.empenhosValidator.validate({
      user,
      empenhos: ordemServicoEntity.empenhos,
      ordemServicoId,
    });
    if (valorOrcamento !== null) {
      if (vinculos.reduce((acc, v) => acc + v.valor, 0) !== valorOrcamento) {
        throw new DomainError(
          `Os empenhos precisam somar o valor do orçamento da OS (${(valorOrcamento / 100).toFixed(2)}).`,
        );
      }
    } else if (!existing.aguardandoEmissao && vinculos.some((v) => v.valor <= 0)) {
      // OS antiga, sem orçamento: o valor continua sendo o que cada empenho destina
      throw new DomainError("Each linked empenho must have a valor greater than 0");
    }
    await this.obraValidator.validate({
      user,
      ordemServicoId,
      obraAnterior: existing.obra_id,
      obraNova: ordemServicoEntity.obra_id,
    });

    const contrato = await this.documentValidator.validate({
      user,
      ordemServico: ordemServicoEntity,
      isCreate: false,
      loteAnterior: existing.lote_id,
    });
    // OS antiga que recebe o lote agora: o desconto dele passa a valer na OS (depois o lote não muda)
    const loteNovo =
      existing.lote_id === null && ordemServicoEntity.lote_id
        ? contrato.lotes.find((l) => l.id === ordemServicoEntity.lote_id)
        : undefined;

    const totalComBdi =
      ordemServicoEntity.totalComBdi === null ? null : Math.round(ordemServicoEntity.totalComBdi * 100);

    // OS que já tramita com a empresa: mudou o conteúdo, ela é reemitida e a ciência recomeça
    const antes = conteudoDe({
      ...existing,
      empenhos: atuais.map((v) => ({ empenho_id: v.empenho_id, valor: v.valor })),
      totalComBdiCentavos: existing.totalComBdi === null ? null : Math.round(existing.totalComBdi * 100),
    });
    const depois = conteudoDe({ ...ordemServicoEntity, totalComBdiCentavos: totalComBdi });
    // A que ainda aguarda emissão não foi para a empresa: nada a reemitir
    const reemitir =
      existing.status === "ATIVO" &&
      !existing.aguardandoEmissao &&
      !isCienciaDispensada({ ...existing, contestacoesAbertas: 0 }) &&
      houveMudancaNoConteudo(antes, depois);
    const emitidaEm = new Date();

    return this.repository.update(ordemServicoId, {
      ...(loteNovo ? { desconto: loteNovo.desconto } : {}),
      ...(reemitir
        ? {
            emissao: {
              tipo: "REEMITIDA" as const,
              emitidaEm,
              cienciaPrazoAte: calcularPrazoCiencia(emitidaEm),
              autor: autorDe(user),
            },
          }
        : {}),
      numero: ordemServicoEntity.numero,
      empenhos: vinculos,
      dataInicio: new Date(ordemServicoEntity.dataInicio),
      dataPrevisaoTermino: new Date(ordemServicoEntity.dataPrevisaoTermino),
      obra_id: ordemServicoEntity.obra_id,
      lote_id: ordemServicoEntity.lote_id,
      setorRequisitante: ordemServicoEntity.setorRequisitante,
      urgencia: ordemServicoEntity.urgencia,
      dataVistoria: ordemServicoEntity.dataVistoria ? new Date(ordemServicoEntity.dataVistoria) : null,
      descricaoProblema: ordemServicoEntity.descricaoProblema,
      dataEmissao: ordemServicoEntity.dataEmissao ? new Date(ordemServicoEntity.dataEmissao) : null,
      prazoMobilizacaoDias: ordemServicoEntity.prazoMobilizacaoDias,
      prazoDias: ordemServicoEntity.prazoDias,
      totalComBdi,
      fiscalSetorial: ordemServicoEntity.fiscalSetorial,
      fiscalTecnico_id: ordemServicoEntity.fiscalTecnico_id,
      fiscalAdministrativo_id: ordemServicoEntity.fiscalAdministrativo_id,
      condicoesEspeciais: ordemServicoEntity.condicoesEspeciais,
    });
  }
}
