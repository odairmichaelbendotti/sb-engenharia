import type { Request, Response } from "express";
import type { CreateTenantUseCase } from "../../application/usecases/tenant/CreateTenantUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import type { GetTenantsUseCase } from "../../application/usecases/tenant/GetTenantsUseCase.js";
import type { ListTenantOptionsUseCase } from "../../application/usecases/tenant/ListTenantOptionsUseCase.js";

export class TenantController {
  constructor(
    private createTenant: CreateTenantUseCase,
    private getTenants: GetTenantsUseCase,
    private listTenantOptions: ListTenantOptionsUseCase,
  ) {}

  async create(req: Request, res: Response) {
    const { name, apelido, cnpj, cep, city, state, address, phone, email } =
      req.body;

    if (
      !name ||
      !apelido ||
      !cnpj ||
      !cep ||
      !city ||
      !state ||
      !address ||
      !phone ||
      !email
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
