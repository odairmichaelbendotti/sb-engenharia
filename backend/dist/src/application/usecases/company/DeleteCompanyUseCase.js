export class DeleteCompanyUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(id) {
        await this.repository.delete(id);
    }
}
//# sourceMappingURL=DeleteCompanyUseCase.js.map