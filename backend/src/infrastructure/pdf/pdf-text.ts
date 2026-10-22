// As fontes padrão do PDF (Times) só cobrem o alfabeto latino do WinAnsi; qualquer outro caractere
// (emoji, setas, texto colado de outro programa com símbolos) sairia como lixo ("ÿý"). Aqui eles
// viram "?", e o texto continua legível.
const WIN_ANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");

function toWinAnsi(text: string): string {
  return Array.from(text.normalize("NFC"))
    .map((char) => {
      if (char === "\t") return " ";
      const code = char.codePointAt(0)!;
      const supported =
        char === "\n" || (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.has(char);
      return supported ? char : "?";
    })
    .join("");
}

/** Copia o valor trocando, em todas as strings (inclusive aninhadas), o que a fonte do PDF não desenha. */
export function sanitizeForPdf<T>(value: T): T {
  if (typeof value === "string") return toWinAnsi(value) as T;
  if (Array.isArray(value)) return value.map((item) => sanitizeForPdf(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeForPdf(item)])) as T;
  }
  return value;
}
