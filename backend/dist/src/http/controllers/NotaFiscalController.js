import { DomainError } from "../../domain/errors/DomainError.js";
import { CreateInvoiceUseCase } from "../../application/usecases/notaFiscal/CreateInvoiceUseCase.js";
export class NotaFiscalController {
    createNotaFiscal;
    listInvoices;
    deleteInvoice;
    updateInvoice;
    constructor(createNotaFiscal, listInvoices, deleteInvoice, updateInvoice) {
        this.createNotaFiscal = createNotaFiscal;
        this.listInvoices = listInvoices;
        this.deleteInvoice = deleteInvoice;
        this.updateInvoice = updateInvoice;
    }
    async create(req, res) {
        const { numero, description, vencimento, value, empenho_id, company_id } = req.body;
        try {
            const nf = await this.createNotaFiscal.execute({
                numero,
                description,
                vencimento,
                value,
                empenho_id,
                company_id,
            });
            console.log(nf);
            res.status(201).json(nf);
        }
        catch (error) {
            if (error instanceof DomainError) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async list(req, res) {
        const data = await this.listInvoices.execute();
        res.status(200).json(data);
    }
    async delete(req, res) {
        const { id } = req.params;
        if (Array.isArray(id) || !id) {
            return res.status(400).json({ message: "Invalid id" });
        }
        try {
            await this.deleteInvoice.execute(id);
            res.status(200).json({ message: "Nota fiscal successfully deleted" });
        }
        catch (error) {
            if (error instanceof DomainError) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async update(req, res) {
        if (!req.params.id || Array.isArray(req.params.id)) {
            return res.status(400).json({ message: "Invalid id" });
        }
        try {
            const updated = await this.updateInvoice.execute(req.body, req.params.id);
            res.status(200).json(updated);
        }
        catch (error) {
            if (error instanceof DomainError) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}
//# sourceMappingURL=NotaFiscalController.js.map