import type { Request, Response } from "express";
import { CompanyUseCase } from "../../application/usecases/CompanyUseCase.js";

export class CompanyController {
  constructor(private createCompany: CompanyUseCase) {}

  async create(req: Request, res: Response) {
    const { name, cnpj, city, state, address, phone, email } = req.body;
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
  }
}
