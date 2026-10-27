import type { Request, Response } from "express";
import type { CreateOrdemServicoUseCase } from "../../application/usecases/ordem-servico/CreateOrdemServicoUseCase.js";
import type { ListOrdensServicoUseCase } from "../../application/usecases/ordem-servico/ListOrdensServicoUseCase.js";
import type { ListOrdemServicoOptionsForObraUseCase } from "../../application/usecases/ordem-servico/ListOrdemServicoOptionsForObraUseCase.js";
import type { UpdateOrdemServicoUseCase } from "../../application/usecases/ordem-servico/UpdateOrdemServicoUseCase.js";
import type { UpdateOrdemServicoStatusUseCase } from "../../application/usecases/ordem-servico/UpdateOrdemServicoStatusUseCase.js";
import type { DeleteOrdemServicoUseCase } from "../../application/usecases/ordem-servico/DeleteOrdemServicoUseCase.js";
import type { GenerateOrdemServicoDocumentUseCase } from "../../application/usecases/ordem-servico/GenerateOrdemServicoDocumentUseCase.js";
import type { GetProximoNumeroOrdemServicoUseCase } from "../../application/usecases/ordem-servico/GetProximoNumeroOrdemServicoUseCase.js";
import type { EmitirOrdemServicoUseCase } from "../../application/usecases/ordem-servico/EmitirOrdemServicoUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import type { OrdemServicoEmpenhoInput, OrdemServicoUrgenciaValue } from "../../domain/entities/OrdemServico.js";

const VALID_STATUSES = ["ATIVO", "FINALIZADO", "CANCELADO"];

// Aceita a lista de empenhos ou o formato antigo (um empenho + valor), ainda
// enviado pelo frontend anterior durante a janela de deploy
function parseEmpenhos(body: Record<string, unknown>): OrdemServicoEmpenhoInput[] {
  if (Array.isArray(body.empenhos)) {
    return body.empenhos.map((item: { empenho_id?: unknown; valor?: unknown }) => ({
      empenho_id: String(item?.empenho_id ?? ""),
      valor: Number(item?.valor),
    }));
  }
  if (body.empenho_id) {
    return [{ empenho_id: String(body.empenho_id), valor: Number(body.valor) }];
  }
  return [];
}

// obra_id ausente = mantém a obra atual (edição); vazio/null = OS sem obra
function parseObraId(body: Record<string, unknown>): string | null | undefined {
  if (!("obra_id" in body)) return undefined;
  return body.obra_id ? String(body.obra_id) : null;
}

// Texto opcional: campo ausente = undefined (na edição mantém o atual); vazio ou null = null (limpa)
function optionalField(body: Record<string, unknown>, key: string): string | null | undefined {
  if (!(key in body)) return undefined;
  const value = body[key];
  return value === null || value === "" ? null : String(value);
}

function optionalNumberField(body: Record<string, unknown>, key: string): number | null | undefined {
  if (!(key in body)) return undefined;
  const value = body[key];
  return value === null || value === "" ? null : Number(value);
}

function parseCondicoesEspeciais(body: Record<string, unknown>): string[] | undefined {
  return Array.isArray(body.condicoesEspeciais) ? body.condicoesEspeciais.map((c) => String(c ?? "")) : undefined;
}

// Dados do documento da OS (criação e edição)
function parseDocumentFields(body: Record<string, unknown>) {
  return {
    lote_id: optionalField(body, "lote_id"),
    setorRequisitante: optionalField(body, "setorRequisitante"),
    urgencia: optionalField(body, "urgencia") as OrdemServicoUrgenciaValue | null | undefined,
    dataVistoria: optionalField(body, "dataVistoria"),
    descricaoProblema: optionalField(body, "descricaoProblema"),
    dataEmissao: optionalField(body, "dataEmissao"),
    prazoMobilizacaoDias: optionalNumberField(body, "prazoMobilizacaoDias") ?? undefined,
    prazoDias: optionalNumberField(body, "prazoDias"),
    totalComBdi: optionalNumberField(body, "totalComBdi"),
    fiscalSetorial: optionalField(body, "fiscalSetorial"),
    fiscalTecnico_id: optionalField(body, "fiscalTecnico_id"),
    fiscalAdministrativo_id: optionalField(body, "fiscalAdministrativo_id"),
    condicoesEspeciais: parseCondicoesEspeciais(body),
  };
}

export class OrdemServicoController {
  constructor(
    private createOrdemServico: CreateOrdemServicoUseCase,
    private listOrdensServico: ListOrdensServicoUseCase,
    private listOrdemServicoOptionsForObra: ListOrdemServicoOptionsForObraUseCase,
    private updateOrdemServico: UpdateOrdemServicoUseCase,
    private updateOrdemServicoStatus: UpdateOrdemServicoStatusUseCase,
    private deleteOrdemServico: DeleteOrdemServicoUseCase,
    private generateOrdemServicoDocument: GenerateOrdemServicoDocumentUseCase,
    private getProximoNumero: GetProximoNumeroOrdemServicoUseCase,
    private emitirOrdemServico: EmitirOrdemServicoUseCase,
  ) {}

  async proximoNumero(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) throw new DomainError("User not found");

      const { lote_id, ano } = req.query;
      if (Array.isArray(lote_id) || Array.isArray(ano)) throw new DomainError("Invalid query");
      const data = await this.getProximoNumero.execute({
        user,
        lote_id: typeof lote_id === "string" && lote_id ? lote_id : null,
        // Sem ano na consulta vale o ano corrente (a OS nova nasce com a data de hoje)
        ano: typeof ano === "string" && ano ? Number(ano) : new Date().getFullYear(),
      });
      res.status(200).json(data);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) throw new DomainError("User not found");

      const ordemServico = await this.createOrdemServico.execute({
        user,
        numero: req.body.numero,
        empenhos: parseEmpenhos(req.body),
        dataInicio: req.body.dataInicio,
        dataPrevisaoTermino: req.body.dataPrevisaoTermino,
        obra_id: parseObraId(req.body) ?? null,
        ...parseDocumentFields(req.body),
      });

      res.status(201).json(ordemServico);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) throw new DomainError("User not found");

      const data = await this.listOrdensServico.execute(user);
      res.status(200).json(data);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async listOptionsForObra(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) throw new DomainError("User not found");

      const data = await this.listOrdemServicoOptionsForObra.execute(user);
      res.status(200).json(data);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      if (!id || Array.isArray(id)) throw new DomainError("Invalid ID");
      if (!user) throw new DomainError("User not found");

      const ordemServico = await this.updateOrdemServico.execute({
        ordemServicoId: id,
        user,
        data: {
          numero: req.body.numero,
          empenhos: parseEmpenhos(req.body),
          dataInicio: req.body.dataInicio,
          dataPrevisaoTermino: req.body.dataPrevisaoTermino,
          obra_id: parseObraId(req.body),
          ...parseDocumentFields(req.body),
        },
      });

      res.status(200).json(ordemServico);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async document(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      if (!id || Array.isArray(id)) throw new DomainError("Invalid ID");
      if (!user) throw new DomainError("User not found");

      const { filename, content } = await this.generateOrdemServicoDocument.execute({
        ordemServicoId: id,
        user,
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.status(200).send(content);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const { user } = req;
      if (!id || Array.isArray(id)) throw new DomainError("Invalid ID");
      if (!user) throw new DomainError("User not found");
      if (!VALID_STATUSES.includes(status)) throw new DomainError("Invalid status");

      const ordemServico = await this.updateOrdemServicoStatus.execute({
        ordemServicoId: id,
        status,
        user,
      });
      res.status(200).json(ordemServico);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      if (!id || Array.isArray(id)) throw new DomainError("Invalid ID");
      if (!user) throw new DomainError("User not found");

      await this.deleteOrdemServico.execute({ ordemServicoId: id, user });
      res.status(200).json({ message: "Ordem de serviço successfully deleted" });
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async emitir(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      if (!id || Array.isArray(id)) throw new DomainError("Invalid ID");
      if (!user) throw new DomainError("User not found");

      await this.emitirOrdemServico.execute({ ordemServicoId: id, user });
      res.status(200).json({ message: "Ordem de serviço emitted" });
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
