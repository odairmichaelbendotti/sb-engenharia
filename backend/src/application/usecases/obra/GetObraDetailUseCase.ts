import { isEmitida } from "../../../domain/ordem-servico/os-planejada.js";
import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import { resumirPlanilha } from "../../../domain/medicao/medicao-resumo.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";

export class GetObraDetailUseCase {
  constructor(
    private repository: IObraRepository,
    private medicaoRepository: IMedicaoRepository,
  ) {}

  async execute({ id, user }: { id: string; user: AuthenticatedUser }) {
    if (user.role === "EMPRESA" && !user.company_id) {
      throw new DomainError("This user is not linked to a company");
    }

    // Mesmo escopo da listagem do mapa: tenant do usuário e, para EMPRESA, só a própria empresa
    const detail = await this.repository.getDetail(
      id,
      user.role === "PLATFORM_ADMIN" ? undefined : user.tenant_id,
      user.role === "EMPRESA" ? user.company_id! : undefined,
    );
    if (!detail) throw new DomainError("Obra not found");

    const execucaoFisica = await this.execucaoFisica(detail.ordensServico);

    // Valores, saldos e notas fiscais pertencem ao domínio administrativo
    if (!new DomainAccessPolicy().can(user.role, "administrativo", "view")) {
      return { ...detail, execucaoFisica, financial: null };
    }
    return { ...detail, execucaoFisica };
  }

  // Avanço físico pelas medições fechadas das OS emitidas e não canceladas que têm orçamento (valores
  // em reais; a planejada fica de fora). A empresa também vê: as medições fechadas já são dela
  private async execucaoFisica(ordensServico: { id: string; status: string; aguardandoEmissao: boolean }[]) {
    const ids = ordensServico.filter((os) => os.status !== "CANCELADO" && isEmitida(os)).map((os) => os.id);
    const planilhas = await this.medicaoRepository.getPlanilhas(ids);
    let valorOrcado = 0;
    let valorMedido = 0;
    for (const planilha of planilhas.values()) {
      const resumo = resumirPlanilha(planilha);
      valorOrcado += resumo.valorOrcado;
      valorMedido += resumo.valorMedido;
    }
    return valorOrcado > 0 ? { valorOrcado: valorOrcado / 100, valorMedido: valorMedido / 100 } : null;
  }
}
