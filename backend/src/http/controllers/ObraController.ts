import type { Request, Response } from "express";
import type { CreateObraUseCase } from "../../application/usecases/obra/CreateObraUseCase.js";
import type { ListObrasUseCase } from "../../application/usecases/obra/ListObrasUseCase.js";
import type { ListObraOptionsForInvoiceUseCase } from "../../application/usecases/obra/ListObraOptionsForInvoiceUseCase.js";
import type { UpdateObraUseCase } from "../../application/usecases/obra/UpdateObraUseCase.js";
import type { UpdateObraStatusUseCase } from "../../application/usecases/obra/UpdateObraStatusUseCase.js";
import type { DeleteObraUseCase } from "../../application/usecases/obra/DeleteObraUseCase.js";
import type { GetObraDetailUseCase } from "../../application/usecases/obra/GetObraDetailUseCase.js";
import type { ListObraOptionsUseCase } from "../../application/usecases/obra/ListObraOptionsUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../domain/polices/DomainAccessPolicy.js";

const VALID_STATUSES = ["EM_ANDAMENTO", "CONCLUIDA", "PARALISADA", "CANCELADA"];

// OS da obra: lista "ordemServico_ids" ou o formato antigo (uma "ordemServico_id"),
// ainda enviado pelo frontend anterior durante a janela de deploy
function parseOrdemServicoIds(body: Record<string, unknown>): string[] | undefined {
  if (Array.isArray(body.ordemServico_ids)) return body.ordemServico_ids.map((id) => String(id ?? ""));
  if (body.ordemServico_id) return [String(body.ordemServico_id)];
  return undefined;
}

export class ObraController {
  constructor(
    private createObra: CreateObraUseCase,
    private listObras: ListObrasUseCase,
    private updateObra: UpdateObraUseCase,
    private updateObraStatus: UpdateObraStatusUseCase,
    private deleteObra: DeleteObraUseCase,
    private listObraOptionsForInvoice: ListObraOptionsForInvoiceUseCase,
    private getObraDetail: GetObraDetailUseCase,
    private listObraOptions: ListObraOptionsUseCase,
  ) {}

  async create(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) throw new DomainError("User not found");

      const { nome, identificacaoPatrimonial, tipo, descricao, latitude, longitude, responsavelTecnico, anotacoes } = req.body;

      const obra = await this.createObra.execute({
        user,
        nome,
        identificacaoPatrimonial,
        tipo,
        descricao,
        latitude: latitude !== undefined && latitude !== "" ? Number(latitude) : undefined,
        longitude: longitude !== undefined && longitude !== "" ? Number(longitude) : undefined,
        responsavelTecnico,
        anotacoes,
        ordemServicoIds: parseOrdemServicoIds(req.body) ?? [],
      });

      res.status(201).json(obra);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) throw new DomainError("User not found");

      if (user.role === "EMPRESA" && !user.company_id) {
        throw new DomainError("This user is not linked to a company");
      }

      const data = await this.listObras.execute({
        tenant_id: user.role === "PLATFORM_ADMIN" ? undefined : user.tenant_id,
        company_id: user.role === "EMPRESA" ? user.company_id! : undefined,
        includeInvoices: new DomainAccessPolicy().can(user.role, "administrativo", "view"),
      });
      res.status(200).json(data);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async detail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      if (!id || Array.isArray(id)) throw new DomainError("Invalid ID");
      if (!user) throw new DomainError("User not found");

      const data = await this.getObraDetail.execute({ id, user });
      res.status(200).json(data);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async listOptions(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) throw new DomainError("User not found");

      const data = await this.listObraOptions.execute(user);
      res.status(200).json(data);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async listOptionsForInvoice(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) throw new DomainError("User not found");

      const { empenho_id } = req.query;
      if (!empenho_id || Array.isArray(empenho_id)) throw new DomainError("Invalid empenho_id");

      const data = await this.listObraOptionsForInvoice.execute({
        user,
        empenho_id: empenho_id as string,
      });
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

      const { nome, identificacaoPatrimonial, tipo, descricao, latitude, longitude, responsavelTecnico, anotacoes } = req.body;

      const obra = await this.updateObra.execute({
        id,
        user,
        obra: {
          nome,
          identificacaoPatrimonial,
          tipo,
          descricao,
          latitude: latitude !== undefined && latitude !== "" ? Number(latitude) : undefined,
          longitude: longitude !== undefined && longitude !== "" ? Number(longitude) : undefined,
          responsavelTecnico,
          anotacoes,
        },
        ordemServicoIds: Array.isArray(req.body.ordemServico_ids) ? parseOrdemServicoIds(req.body) : undefined,
      });

      res.status(200).json(obra);
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

      const obra = await this.updateObraStatus.execute({ id, status, user });
      res.status(200).json(obra);
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

      await this.deleteObra.execute({ id, user });
      res.status(200).json({ message: "Obra successfully deleted" });
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
