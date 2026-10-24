import type { Request, Response } from "express";
import type { GetPlanilhaOrcamentoUseCase } from "../../application/usecases/medicao/GetPlanilhaOrcamentoUseCase.js";
import type { SaveOrcamentoUseCase } from "../../application/usecases/medicao/SaveOrcamentoUseCase.js";
import type { CreateMedicaoUseCase } from "../../application/usecases/medicao/CreateMedicaoUseCase.js";
import type { GetMedicaoUseCase } from "../../application/usecases/medicao/GetMedicaoUseCase.js";
import type { UpdateMedicaoUseCase } from "../../application/usecases/medicao/UpdateMedicaoUseCase.js";
import type { DeleteMedicaoUseCase } from "../../application/usecases/medicao/DeleteMedicaoUseCase.js";
import type { FecharMedicaoUseCase } from "../../application/usecases/medicao/FecharMedicaoUseCase.js";
import type { ReabrirMedicaoUseCase } from "../../application/usecases/medicao/ReabrirMedicaoUseCase.js";
import type { GenerateMedicaoDocumentUseCase } from "../../application/usecases/medicao/GenerateMedicaoDocumentUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";

function paramId(req: Request) {
  const { id } = req.params;
  if (!id || Array.isArray(id)) throw new DomainError("Invalid ID");
  return id;
}

function body(req: Request): Record<string, unknown> {
  return req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};
}

function handleError(res: Response, error: unknown) {
  if (error instanceof DomainError) return res.status(400).json({ message: error.message });
  return res.status(500).json({ message: "Internal server error" });
}

// Orçamento (planilha de itens) da OS e as medições feitas sobre ele
export class MedicaoController {
  constructor(
    private getPlanilhaOrcamento: GetPlanilhaOrcamentoUseCase,
    private saveOrcamentoUseCase: SaveOrcamentoUseCase,
    private createMedicao: CreateMedicaoUseCase,
    private getMedicao: GetMedicaoUseCase,
    private updateMedicao: UpdateMedicaoUseCase,
    private deleteMedicao: DeleteMedicaoUseCase,
    private fecharMedicao: FecharMedicaoUseCase,
    private reabrirMedicao: ReabrirMedicaoUseCase,
    private generateMedicaoDocument: GenerateMedicaoDocumentUseCase,
  ) {}

  async orcamento(req: Request, res: Response) {
    try {
      const data = await this.getPlanilhaOrcamento.execute({ ordemServicoId: paramId(req), user: req.user });
      res.set("Cache-Control", "no-store");
      res.status(200).json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async saveOrcamento(req: Request, res: Response) {
    try {
      await this.saveOrcamentoUseCase.execute({ ordemServicoId: paramId(req), user: req.user, itens: body(req).itens });
      res.status(200).json({ message: "Budget saved" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await this.createMedicao.execute({ user: req.user, body: body(req) });
      res.status(201).json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async detail(req: Request, res: Response) {
    try {
      const data = await this.getMedicao.execute({ medicaoId: paramId(req), user: req.user });
      res.set("Cache-Control", "no-store");
      res.status(200).json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      await this.updateMedicao.execute({ medicaoId: paramId(req), user: req.user, body: body(req) });
      res.status(200).json({ message: "Medição updated" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await this.deleteMedicao.execute({ medicaoId: paramId(req), user: req.user });
      res.status(200).json({ message: "Medição deleted" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async fechar(req: Request, res: Response) {
    try {
      await this.fecharMedicao.execute({ medicaoId: paramId(req), user: req.user });
      res.status(200).json({ message: "Medição closed" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async reabrir(req: Request, res: Response) {
    try {
      await this.reabrirMedicao.execute({ medicaoId: paramId(req), user: req.user });
      res.status(200).json({ message: "Medição reopened" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async document(req: Request, res: Response) {
    try {
      const { filename, content } = await this.generateMedicaoDocument.execute({
        medicaoId: paramId(req),
        user: req.user,
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.status(200).send(content);
    } catch (error) {
      return handleError(res, error);
    }
  }
}
