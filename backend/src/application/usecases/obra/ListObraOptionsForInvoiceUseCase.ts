import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";
import { reais, valoresDasMedicoes } from "../medicao/medicao-presenter.js";

export class ListObraOptionsForInvoiceUseCase {
  constructor(
    private repository: IObraRepository,
    private medicaoRepository: IMedicaoRepository,
  ) {}

  async execute({ user, empenho_id }: { user: AuthenticatedUser; empenho_id: string }) {
    if (!empenho_id) {
      throw new DomainError("empenho_id is required");
    }

    const opcoes = await this.repository.listOptionsForInvoice(user.tenant_id, empenho_id);

    // Medições fechadas de cada OS, com o valor e a nota que já paga cada uma: a nota fiscal
    // pode ser lançada por uma delas em vez de um valor digitado
    const planilhas = await this.medicaoRepository.getPlanilhas(opcoes.map((o) => o.ordemServico.id));
    const fechadas = [...planilhas.values()].flatMap((p) => p.medicoes.filter((m) => m.status === "FECHADA"));
    const notas = await this.medicaoRepository.findNotasFiscais(fechadas.map((m) => m.id));

    return opcoes.map((opcao) => {
      const planilha = planilhas.get(opcao.ordemServico.id);
      const valores = planilha ? valoresDasMedicoes(planilha) : new Map<string, number>();
      const medicoes = (planilha?.medicoes ?? [])
        .filter((m) => m.status === "FECHADA")
        .map((m) => ({
          id: m.id,
          numero: m.numero,
          periodoInicio: m.periodoInicio,
          periodoFim: m.periodoFim,
          valor: reais(valores.get(m.id) ?? 0),
          notaFiscal: notas.get(m.id) ?? null,
        }));
      return { ...opcao, medicoes };
    });
  }
}
