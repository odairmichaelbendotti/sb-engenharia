import { DomainError } from "../../domain/errors/DomainError.js";
export class EmpenhoController {
    createEmpenho;
    listEmpenhos;
    deleteEmpenho;
    updateEmpenho;
    updateStatusEmpenho;
    constructor(createEmpenho, listEmpenhos, deleteEmpenho, updateEmpenho, updateStatusEmpenho) {
        this.createEmpenho = createEmpenho;
        this.listEmpenhos = listEmpenhos;
        this.deleteEmpenho = deleteEmpenho;
        this.updateEmpenho = updateEmpenho;
        this.updateStatusEmpenho = updateStatusEmpenho;
    }
    async create(req, res) {
        try {
            const { numero, description, startAt, endAt, value, company_id } = req.body;
            const { user } = req;
            if (!user) {
                throw new DomainError("User not found");
            }
            const empenho = await this.createEmpenho.execute(user, {
                numero,
                description,
                startAt,
                endAt,
                value,
                company_id,
            });
            res.status(201).json(empenho);
        }
        catch (error) {
            if (error instanceof DomainError) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async list(req, res) {
        try {
            const empenhos = await this.listEmpenhos.execute();
            res.status(200).json(empenhos);
        }
        catch (error) {
            if (error instanceof DomainError) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async delete(req, res) {
        try {
            const { empenhoId } = req.params;
            const { user } = req;
            if (!user) {
                throw new DomainError("User not found");
            }
            if (!empenhoId || Array.isArray(empenhoId)) {
                throw new DomainError("Empenho ID is required");
            }
            await this.deleteEmpenho.execute({
                user,
                empenhoId,
            });
            res.status(204).send();
        }
        catch (error) {
            if (error instanceof DomainError) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async update(req, res) {
        const { empenhoId } = req.params;
        const { numero, description, startAt, endAt, value, company_id } = req.body;
        const { user } = req;
        if (Array.isArray(empenhoId) || !empenhoId) {
            throw new DomainError("Empenho ID is required");
        }
        if (!user) {
            throw new DomainError("User not found");
        }
        if (!numero ||
            !description ||
            !startAt ||
            !endAt ||
            !value ||
            !company_id) {
            throw new DomainError("All fields are required");
        }
        const editedEmpenho = await this.updateEmpenho.execute(empenhoId, req.body, user);
        res.status(200).json(editedEmpenho);
        try {
        }
        catch (error) {
            if (error instanceof DomainError) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async updateStatus(req, res) {
        const { empenhoId } = req.params;
        const { status } = req.body;
        const { user } = req;
        console.log(empenhoId);
        if (!user) {
            throw new DomainError("User not found");
        }
        if (!empenhoId || Array.isArray(empenhoId)) {
            throw new DomainError("Empenho ID is required");
        }
        if (!status) {
            throw new DomainError("Status is required");
        }
        const updatedEmpenho = await this.updateStatusEmpenho.execute(empenhoId, status, user);
        res.status(200).json(updatedEmpenho);
    }
}
//# sourceMappingURL=EmpenhoController.js.map