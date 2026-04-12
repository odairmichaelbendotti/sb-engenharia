import type { Request, Response } from "express";
import { CreateCompanyUseCase } from "../../application/usecases/company/CreateCompanyUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import type { ListCompaniesUseCase } from "../../application/usecases/company/ListCompaniesUseCase.js";
import type { DeleteCompanyUseCase } from "../../application/usecases/company/DeleteCompanyUseCase.js";
import type { UpdateCompanyUseCase } from "../../application/usecases/company/UpdateCompanyUseCase.js";

export class CompanyController {
  constructor(
    private createCompany: CreateCompanyUseCase,
    private listCompanies: ListCompaniesUseCase,
    private deleteCompany: DeleteCompanyUseCase,
    private updateCompany: UpdateCompanyUseCase,
  ) {}

  async create(req: Request, res: Response) {
    const { name, cnpj, city, state, address, phone, email } = req.body;
    try {
      const company = await this.createCompany.execute({
        name,
        cnpj,
        city,
        state,
        address,
        phone,
        email,
      });
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof DomainError) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
  async list(req: Request, res: Response) {
    try {
      const data = await this.listCompanies.execute();

      if (data.companies.length === 0)
        return res
          .status(204)
          .json({ message: "No companies registered in the system" });

      res.status(200).json(data);
    } catch (error) {
      if (error instanceof DomainError) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
  async delete(req: Request, res: Response) {
    const { id } = req.params;

    if (Array.isArray(id) || !id) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    try {
      await this.deleteCompany.execute(id);
      return res.status(200).json({ message: "Company successfully deleted" });
    } catch (error) {
      console.log(error);
      if (error instanceof DomainError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name, cnpj, city, state, address, phone, email } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    if (!name || !cnpj || !city || !state || !address || !phone || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const company = {
      name,
      cnpj,
      city,
      state,
      address,
      phone,
      email,
    };

    if (Array.isArray(id) || !id) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    try {
      const updatedCompany = await this.updateCompany.execute({ id, company });
      res.status(200).json(updatedCompany);
    } catch (error) {
      if (error instanceof DomainError) {
        res.status(400).json({ message: error.message });
      } else {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
}
