import type { IHashComparer } from "../../domain/cryptography/HashComparer.js";
import type { IHashGenerator } from "../../domain/cryptography/HashGenerator.js";
import bcrypt from "bcrypt";

export class HashGenerator implements IHashGenerator, IHashComparer {
  async generate(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
  async compare({
    password,
    hash,
  }: {
    password: string;
    hash: string;
  }): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
