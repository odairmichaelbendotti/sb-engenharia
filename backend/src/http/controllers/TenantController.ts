import type { Request, Response } from "express";
import type { CreateTenantUseCase } from "../../application/usecases/tenant/CreateTenantUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import type { GetTenantsUseCase } from "../../application/usecases/tenant/GetTenantsUseCase.js";
import type { ListTenantOptionsUseCase } from "../../application/usecases/tenant/ListTenantOptionsUseCase.js";
import type { GetMyTenantUseCase } from "../../application/usecases/tenant/GetMyTenantUseCase.js";
import type { GetTenantsSummaryUseCase } from "../../application/usecases/tenant/GetTenantsSummaryUseCase.js";

export class TenantController {
  constructor(
    private createTenant: CreateTenantUseCase,
    private getTenants: GetTenantsUseCase,
    private listTenantOptions: ListTenantOptionsUseCase,
    private getMyTenant: GetMyTenantUseCase,
    private getTenantsSummary: GetTenantsSummaryUseCase,
  ) {}

  async create(req: Request, res: Response) {
    const { name, apelido, cnpj, cep, city, state, address, phone, email, latitude, longitude } =
      req.body;

    const latitudeNum = Number(latitude);
    const longitudeNum = Number(longitude);

    if (
      !name ||
      !apelido ||
      !cnpj ||
      !cep ||
      !city ||
      !state ||
      !address ||
      !phone ||
      !email ||
      isNaN(latitudeNum) ||
      isNaN(longitudeNum)
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const tenant = await this.createTenant.execute({
        name,
        apelido,
        cnpj,
        cep,
        city,
        state,
        address,
        phone,
        email,
        latitude: latitudeNum,
        longitude: longitudeNum,
      });
      res.status(201).json(tenant);
    } catch (error) {
      if (error instanceof DomainError) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  async me(req: Request, res: Response) {
    try {
      if (!req.user) throw new DomainError("User not found");
      const tenant = await this.getMyTenant.execute(req.user.tenant_id);
      if (!tenant) throw new DomainError("Tenant not found");
      res.status(200).json({
        id: tenant.id,
        name: tenant.name,
        latitude: tenant.latitude,
        longitude: tenant.longitude,
      });
    } catch (error) {
      if (error instanceof DomainError) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
  async getAll(req: Request, res: Response) {
    try {
      const tenants = await this.getTenants.execute();
      res.status(200).json(tenants);
    } catch (error) {
      if (error instanceof DomainError) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
  async summary(req: Request, res: Response) {
    try {
      const summary = await this.getTenantsSummary.execute();
      res.status(200).json(summary);
    } catch (error) {
      if (error instanceof DomainError) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
  async listPublicOptions(req: Request, res: Response) {
    try {
      const tenants = await this.listTenantOptions.execute();
      res.status(200).json(tenants);
    } catch (error) {
      if (error instanceof DomainError) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
}
