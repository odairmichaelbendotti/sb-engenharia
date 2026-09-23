import { randomBytes } from "node:crypto";

// Sem caracteres ambíguos (0/O, 1/l/I) — a senha é lida/digitada por um humano.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generateRandomPassword(length = 12): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}
