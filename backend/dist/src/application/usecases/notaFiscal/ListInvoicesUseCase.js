export class ListInvoicesUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute() {
        return await this.repository.list();
    }
}
//# sourceMappingURL=ListInvoicesUseCase.js.map