import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

type FontFile = { family: string; weight: number; style: "normal" | "italic"; file: string };

const INTER_REGULAR: FontFile = { family: "Inter", weight: 400, style: "normal", file: "@fontsource/inter/files/inter-latin-400-normal.woff2" };

// Fontes do documento, embutidas no HTML: o Chrome renderiza sem acessar a rede.
// Subconjunto "latin" do fontsource cobre o português (acentos, º, ², –, ×, −)
const FONT_FILES: FontFile[] = [
  { family: "Source Serif 4", weight: 400, style: "normal", file: "@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff2" },
  { family: "Source Serif 4", weight: 400, style: "italic", file: "@fontsource/source-serif-4/files/source-serif-4-latin-400-italic.woff2" },
  { family: "Source Serif 4", weight: 600, style: "normal", file: "@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff2" },
  { family: "Source Serif 4", weight: 600, style: "italic", file: "@fontsource/source-serif-4/files/source-serif-4-latin-600-italic.woff2" },
  { family: "Source Serif 4", weight: 700, style: "normal", file: "@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff2" },
  INTER_REGULAR,
  { family: "Inter", weight: 500, style: "normal", file: "@fontsource/inter/files/inter-latin-500-normal.woff2" },
  { family: "Inter", weight: 600, style: "normal", file: "@fontsource/inter/files/inter-latin-600-normal.woff2" },
  { family: "Inter", weight: 700, style: "normal", file: "@fontsource/inter/files/inter-latin-700-normal.woff2" },
];

// Lidas uma vez por processo e reaproveitadas
const cache = new Map<FontFile, string>();

function fontFace(font: FontFile): string {
  let rule = cache.get(font);
  if (!rule) {
    const base64 = readFileSync(require.resolve(font.file)).toString("base64");
    rule = `@font-face{font-family:"${font.family}";font-weight:${font.weight};font-style:${font.style};src:url(data:font/woff2;base64,${base64}) format("woff2");}`;
    cache.set(font, rule);
  }
  return rule;
}

/** Regras @font-face de todas as fontes do documento, em base64. */
export function embeddedFontFaces(): string {
  return FONT_FILES.map(fontFace).join("\n");
}

/** Só a Inter regular, para o rodapé (o Chrome o renderiza à parte, sem as fontes da página). */
export function embeddedFooterFontFace(): string {
  return fontFace(INTER_REGULAR);
}
