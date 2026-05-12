import type { IHashComparer } from "../../domain/cryptography/HashComparer.js";
import type { IHashGenerator } from "../../domain/cryptography/HashGenerator.js";
export declare class HashGenerator implements IHashGenerator, IHashComparer {
    generate(password: string): Promise<string>;
    compare({ password, hash, }: {
        password: string;
        hash: string;
    }): Promise<boolean>;
}
//# sourceMappingURL=HashGenerator.d.ts.map