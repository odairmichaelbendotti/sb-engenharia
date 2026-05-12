import bcrypt from "bcrypt";
export class HashGenerator {
    async generate(password) {
        return await bcrypt.hash(password, 10);
    }
    async compare({ password, hash, }) {
        return await bcrypt.compare(password, hash);
    }
}
//# sourceMappingURL=HashGenerator.js.map