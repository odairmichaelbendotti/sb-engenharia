import type { Request, Response } from "express";
import { CreateCompanyUseCase } from "../../application/usecases/company/CreateCompanyUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import type { ListCompaniesUseCase } from "../../application/usecases/company/ListCompaniesUseCase.js";

export class CompanyController {
  constructor(
    private createCompany: CreateCompanyUseCase,
    private listCompanies: ListCompaniesUseCase,
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
}
