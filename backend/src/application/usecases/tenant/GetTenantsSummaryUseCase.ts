import type { ITenantRepository } from "../../../domain/repositories/ITenantRepository.js";
import type { IContratoRepository } from "../../../domain/repositories/IContratoRepository.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";
import type { IInvoiceRepository } from "../../../domain/repositories/IInvoiceRepository.js";

export type TenantSummaryEntry = {
  tenant: { id: string; name: string };
  stats: {
    contratosAtivos: number;
    empenhosAtivos: number;
    empenhosAtivosValor: number;
    osAtivas: number;
    obrasEmAndamento: number;
    orcamentoTotal: number;
    valorExecutadoTotal: number;
    notasPendentesVencidasCount: number;
    notasPendentesVencidasValor: number;
  };
};

export class GetTenantsSummaryUseCase {
  constructor(
    private tenantRepository: ITenantRepository,
    private contratoRepository: IContratoRepository,
    private empenhoRepository: IEmpenhoRepository,
    private ordemServicoRepository: IOrdemServicoRepository,
    private obraRepository: IObraRepository,
    private invoiceRepository: IInvoiceRepository,
  ) {}

  async execute(): Promise<TenantSummaryEntry[]> {
    const [tenants, contratos, empenhos, ordensServico, obras, invoices] = await Promise.all([
      this.tenantRepository.getAll(),
      this.contratoRepository.countActiveByTenant(),
      this.empenhoRepository.summaryByTenant(),
      this.ordemServicoRepository.countActiveByTenant(),
      this.obraRepository.summaryByTenant(),
      this.invoiceRepository.summaryByTenant(),
    ]);

    const contratoByTenant = new Map(contratos.map((c) => [c.tenant_id, c]));
    const empenhoByTenant = new Map(empenhos.map((e) => [e.tenant_id, e]));
    const osByTenant = new Map(ordensServico.map((o) => [o.tenant_id, o]));
    const obraByTenant = new Map(obras.map((o) => [o.tenant_id, o]));
    const invoiceByTenant = new Map(invoices.map((i) => [i.tenant_id, i]));

    return tenants.map((tenant) => ({
      tenant: { id: tenant.id, name: tenant.name },
      stats: {
        contratosAtivos: contratoByTenant.get(tenant.id)?.count ?? 0,
        empenhosAtivos: empenhoByTenant.get(tenant.id)?.ativos ?? 0,
        empenhosAtivosValor: empenhoByTenant.get(tenant.id)?.valorAtivos ?? 0,
        osAtivas: osByTenant.get(tenant.id)?.count ?? 0,
        obrasEmAndamento: obraByTenant.get(tenant.id)?.emAndamento ?? 0,
        orcamentoTotal: obraByTenant.get(tenant.id)?.orcamentoTotal ?? 0,
        valorExecutadoTotal: obraByTenant.get(tenant.id)?.valorExecutadoTotal ?? 0,
        notasPendentesVencidasCount: invoiceByTenant.get(tenant.id)?.pendentesVencidasCount ?? 0,
        notasPendentesVencidasValor: invoiceByTenant.get(tenant.id)?.pendentesVencidasValor ?? 0,
      },
    }));
  }
}
