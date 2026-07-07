import type { IHashGenerator } from "../../../domain/cryptography/HashGenerator.js";
import type { ITokenGenerator } from "../../../domain/cryptography/TokenGenerator.js";
import { User } from "../../../domain/entities/User.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { ITenantRepository } from "../../../domain/repositories/ITenantRepository.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";

export class SignUpUseCase {
  constructor(
    private repository: IUserRepository,
    private hashGenerator: IHashGenerator,
    private tokenGenerator: ITokenGenerator,
    private verifyTenant: ITenantRepository,
  ) {}

  async execute({
    name,
    tenant_id,
    email,
    password,
    approved,
  }: {
    name: string;
    tenant_id: string;
    email: string;
    password: string;
    approved: boolean;
  }) {
    const userExists = await this.repository.findByEmail(email);

    if (userExists) {
      throw new DomainError("User already exists");
    }

    const tenantExists = await this.verifyTenant.findById(tenant_id);

    if (!tenantExists) {
      throw new DomainError("TENANT_NOT_FOUND");
    }

    const hashedPassword = await this.hashGenerator.generate(password);
    const user = new User({
      name,
      tenant_id,
      email,
      approved,
      password: hashedPassword,
    });

    const createdUser = await this.repository.create(user);

    const token = this.tokenGenerator.generate({
      id: createdUser.id,
      name: createdUser.name,
      tenant_id: createdUser.tenant_id,
      email: createdUser.email,
      role: createdUser.role,
    });

    return { createdUser, token };
  }
}
