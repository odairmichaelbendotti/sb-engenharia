export class UpdateInvoiceUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(notaFiscal, id) {
        return this.repository.update(notaFiscal, id);
    }
}
//# sourceMappingURL=UpdateInvoiceUseCase.js.map