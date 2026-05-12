export class ListEmpenhosUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute() {
        return await this.repository.list();
    }
}
//# sourceMappingURL=ListEmpenhosUseCase.js.map