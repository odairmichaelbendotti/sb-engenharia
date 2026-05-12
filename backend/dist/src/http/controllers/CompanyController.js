import { CreateCompanyUseCase } from "../../application/usecases/company/CreateCompanyUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";
export class CompanyController {
    createCompany;
    listCompanies;
    deleteCompany;
    updateCompany;
    constructor(createCompany, listCompanies, deleteCompany, updateCompany) {
        this.createCompany = createCompany;
        this.listCompanies = listCompanies;
        this.deleteCompany = deleteCompany;
        this.updateCompany = updateCompany;
    }
    async create(req, res) {
        const { name, cnpj, cep, city, state, address, phone, email } = req.body;
        try {
            const company = await this.createCompany.execute({
                name,
                cnpj,
                cep,
                city,
                state,
                address,
                phone,
                email,
            });
            res.status(201).json(company);
        }
        catch (error) {
            if (error instanceof DomainError) {
                res.status(400).json({ message: error.message });
            }
            else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    }
    async list(req, res) {
        try {
            const data = await this.listCompanies.execute();
            if (data.companies.length === 0)
                return res
                    .status(204)
                    .json({ message: "No companies registered in the system" });
            res.status(200).json(data);
        }
        catch (error) {
            if (error instanceof DomainError) {
                res.status(400).json({ message: error.message });
            }
            else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    }
    async delete(req, res) {
        const { id } = req.params;
        if (Array.isArray(id) || !id) {
            return res.status(400).json({ message: "Invalid ID" });
        }
        try {
            await this.deleteCompany.execute(id);
            return res.status(200).json({ message: "Company successfully deleted" });
        }
        catch (error) {
            console.log(error);
            if (error instanceof DomainError) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async update(req, res) {
        const { id } = req.params;
        const { name, cnpj, cep, city, state, address, phone, email } = req.body;
        if (!id) {
            return res.status(400).json({ message: "Invalid ID" });
        }
        if (!name ||
            !cnpj ||
            !cep ||
            !city ||
            !state ||
            !address ||
            !phone ||
            !email) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const company = {
            name,
            cnpj,
            cep,
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
        }
        catch (error) {
            if (error instanceof DomainError) {
                res.status(400).json({ message: error.message });
            }
            else {
                console.log(error);
                res.status(500).json({ message: "Internal server error" });
            }
        }
    }
}
//# sourceMappingURL=CompanyController.js.map