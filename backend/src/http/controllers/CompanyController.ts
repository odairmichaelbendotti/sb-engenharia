import type { Request, Response } from "express";
import { CreateCompanyUseCase } from "../../application/usecases/company/CreateCompanyUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";

export class CompanyController {
  constructor(private createCompany: CreateCompanyUseCase) {}

  async create(req: Request, res: Response) {
    const { name, cnpj, city, state, address, phone, email } = req.body;
    try {
      await this.createCompany.execute({
        name,
        cnpj,
        city,
        state,
        address,
        phone,
        email,
      });
      res.status(201).json({ message: "Company created successfully" });
    } catch (error) {
      if (error instanceof DomainError) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
}
