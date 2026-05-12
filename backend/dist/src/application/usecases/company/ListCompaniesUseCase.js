export class ListCompaniesUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute() {
        return this.repository.list();
    }
}
//# sourceMappingURL=ListCompaniesUseCase.js.map