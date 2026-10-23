import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { OrdemServicoEntity, type OrdemServicoType } from "../../../domain/entities/OrdemServico.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";
import { normalizeInput, ORDEM_SERVICO_RULES } from "../../../domain/normalization/input-rules.js";
import { OrdemServicoEmpenhosValidator } from "./OrdemServicoEmpenhosValidator.js";
import { normalizeFreeText } from "../../../domain/normalization/text-normalizers.js";
import { OrdemServicoDocumentValidator } from "./OrdemServicoDocumentValidator.js";
import { OrdemServicoObraValidator } from "./OrdemServicoObraValidator.js";
import { calcularPrazoCiencia } from "../../../domain/tramitacao/ciencia.js";
import { autorDe } from "../ordem-servico-tramitacao/tramitacao-access.js";

export class CreateOrdemServicoUseCase {
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

  async execute(input: Omit<OrdemServicoType, "tenant_id"> & { user: AuthenticatedUser }) {
    // Padroniza os textos antes de validar, buscar duplicados e gravar
    const normalized = normalizeInput(input, ORDEM_SERVICO_RULES);
    const { user, empenhos, dataInicio, dataPrevisaoTermino, obra_id } = normalized;
    // Sem prazo em dias o término vem das datas; com ele é calculado a partir do início
    if (!empenhos?.length || !dataInicio || (!normalized.prazoDias && !dataPrevisaoTermino)) {
      throw new DomainError("All fields are required");
    }

    const canEdit = new DomainAccessPolicy().canDo(user.role, "createOrdemServico");
    if (!canEdit) {
      throw new DomainError("You are not authorized to create an ordem de serviço");
    }

    // O número é gerado (sequência por lote e ano); a data de emissão vem preenchida com hoje
    const dataEmissao = normalized.dataEmissao || new Date().toISOString().slice(0, 10);
    const ordemServicoEntity = new OrdemServicoEntity({
      ...normalized,
      numero: "",
      dataEmissao,
      condicoesEspeciais: normalized.condicoesEspeciais?.map((c) => normalizeFreeText(c)),
      tenant_id: user.tenant_id,
    });
    const vinculos = await this.empenhosValidator.validate({ user, empenhos: ordemServicoEntity.empenhos });
    await this.obraValidator.validate({ user, obraAnterior: null, obraNova: ordemServicoEntity.obra_id });
    const contrato = await this.documentValidator.validate({ user, ordemServico: ordemServicoEntity, isCreate: true });

    const lote = contrato.lotes.find((l) => l.id === ordemServicoEntity.lote_id);
    // Emissão no horário do servidor: a partir dela a empresa tem o prazo para dar ciência
    const emitidaEm = new Date();
    return this.repository.create({
      emissao: { tipo: "EMITIDA", emitidaEm, cienciaPrazoAte: calcularPrazoCiencia(emitidaEm), autor: autorDe(user) },
      numero: "",
      numeracao: { loteNumero: lote?.numero ?? null, ano: Number(dataEmissao.slice(0, 4)) },
      tenant_id: user.tenant_id,
      empenhos: vinculos,
      dataInicio: new Date(ordemServicoEntity.dataInicio),
      dataPrevisaoTermino: new Date(ordemServicoEntity.dataPrevisaoTermino),
      obra_id: ordemServicoEntity.obra_id,
      lote_id: ordemServicoEntity.lote_id,
      setorRequisitante: ordemServicoEntity.setorRequisitante,
      urgencia: ordemServicoEntity.urgencia,
      dataVistoria: ordemServicoEntity.dataVistoria ? new Date(ordemServicoEntity.dataVistoria) : null,
      descricaoProblema: ordemServicoEntity.descricaoProblema,
      dataEmissao: new Date(dataEmissao),
      prazoMobilizacaoDias: ordemServicoEntity.prazoMobilizacaoDias,
      prazoDias: ordemServicoEntity.prazoDias,
      // Math.round evita que erros de ponto flutuante quebrem o insert na coluna Int do Prisma
      totalComBdi:
        ordemServicoEntity.totalComBdi === null ? null : Math.round(ordemServicoEntity.totalComBdi * 100),
      fiscalSetorial: ordemServicoEntity.fiscalSetorial,
      fiscalTecnico_id: ordemServicoEntity.fiscalTecnico_id,
      fiscalAdministrativo_id: ordemServicoEntity.fiscalAdministrativo_id,
      condicoesEspeciais: ordemServicoEntity.condicoesEspeciais,
    });
  }
}
