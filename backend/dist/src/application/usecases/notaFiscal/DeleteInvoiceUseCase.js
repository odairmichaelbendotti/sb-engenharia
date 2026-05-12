export class DeleteInvoiceUseCase {
    deleteInvoice;
    constructor(deleteInvoice) {
        this.deleteInvoice = deleteInvoice;
    }
    async execute(id) {
        return await this.deleteInvoice.delete(id);
    }
}
//# sourceMappingURL=DeleteInvoiceUseCase.js.map