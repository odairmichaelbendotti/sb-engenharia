import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { User } from "../../../domain/entities/User.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { IHashGenerator } from "../../../domain/cryptography/HashGenerator.js";
import { generateRandomPassword } from "../../../utils/generateRandomPassword.js";

export class CreateCompanyAccessUseCase {
  constructor(
    private companyRepository: ICompanyRepository,
    private userRepository: IUserRepository,
    private hashGenerator: IHashGenerator,
  ) {}

  async execute({
    user,
    companyId,
    name,
    email,
  }: {
    user: AuthenticatedUser;
    companyId: string;
    name: string;
    email: string;
  }) {
    const canEdit = new DomainAccessPolicy().can(user.role, "administrativo", "edit");
    if (!canEdit) {
      throw new DomainError("You are not authorized to create a company access");
    }

    if (!name || !email) {
      throw new DomainError("Name and email are required");
    }

    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new DomainError("Company not found");
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new DomainError("Email already in use");
    }

    const plainPassword = generateRandomPassword();
    const hashedPassword = await this.hashGenerator.generate(plainPassword);

    const userEntity = new User({
      id: "",
      name,
      email,
      password: hashedPassword,
      role: "EMPRESA",
      approved: true,
      tenant_id: user.tenant_id,
      company_id: companyId,
    });

    const createdUser = await this.userRepository.create(userEntity);

    return { user: createdUser, password: plainPassword };
  }
}
