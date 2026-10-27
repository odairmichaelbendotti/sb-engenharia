import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { OrdemServicoEntity } from "../../../domain/entities/OrdemServico.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type {
  IOrdemServicoRepository,
  OrdemServicoContratoDados,
} from "../../../domain/repositories/IOrdemServicoRepository.js";

// Campos que o documento da OS exige quando a OS é criada (o valor vem depois, do orçamento)
const REQUIRED_ON_CREATE = [
  "setorRequisitante",
  "urgencia",
  "dataVistoria",
  "descricaoProblema",
  "prazoDias",
  "fiscalSetorial",
  "fiscalTecnico_id",
  "fiscalAdministrativo_id",
] as const;

// Valida os dados do documento contra o contrato da OS: o lote e os fiscais precisam ser
// dele (o lote só existe se o contrato tiver lotes). Na criação todos os campos são obrigatórios;
// na edição eles podem continuar vazios, porque as OS anteriores ao documento não os têm
export class OrdemServicoDocumentValidator {
  constructor(private repository: IOrdemServicoRepository) {}

  async validate({
    user,
    ordemServico,
    isCreate,
    loteAnterior,
  }: {
    user: AuthenticatedUser;
    ordemServico: OrdemServicoEntity;
    isCreate: boolean;
    // Lote atual da OS na edição (um lote já definido não muda)
    loteAnterior?: string | null;
  }): Promise<OrdemServicoContratoDados> {
    const contrato = await this.repository.findContratoByEmpenho(ordemServico.empenhoPrincipalId);
    if (!contrato || contrato.tenant_id !== user.tenant_id) {
      throw new DomainError("Contrato not found");
    }

    if (isCreate) {
      for (const field of REQUIRED_ON_CREATE) {
        if (ordemServico[field] === null) {
          throw new DomainError(`OrdemServico ${field} is required`);
        }
      }
    }

    if (contrato.lotes.length === 0) {
      if (ordemServico.lote_id) throw new DomainError("This contrato has no lotes");
    } else {
      if (isCreate && !ordemServico.lote_id) throw new DomainError("OrdemServico lote is required");
      if (ordemServico.lote_id && !contrato.lotes.some((l) => l.id === ordemServico.lote_id)) {
        throw new DomainError("Lote not found in this contrato");
      }
    }
    if (!isCreate && loteAnterior && ordemServico.lote_id !== loteAnterior) {
      throw new DomainError("The lote of an ordem de serviço cannot be changed");
    }

    this.validateFiscal(contrato, ordemServico.fiscalTecnico_id, "TECNICO");
    this.validateFiscal(contrato, ordemServico.fiscalAdministrativo_id, "ADMINISTRATIVO");

    return contrato;
  }

  private validateFiscal(
    contrato: OrdemServicoContratoDados,
    fiscal_id: string | null,
    tipo: "TECNICO" | "ADMINISTRATIVO",
  ) {
    if (!fiscal_id) return;
    if (!contrato.fiscais.some((f) => f.id === fiscal_id && f.tipo === tipo)) {
      throw new DomainError(`Fiscal ${tipo === "TECNICO" ? "técnico" : "administrativo"} not found in this contrato`);
    }
  }
}
