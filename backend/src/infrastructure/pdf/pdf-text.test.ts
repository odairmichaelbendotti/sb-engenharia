import { describe, expect, it } from "vitest";
import { sanitizeForPdf } from "./pdf-text.js";

describe("sanitizeForPdf", () => {
  it("mantém acentos, travessão, aspas e símbolos do português", () => {
    const text = "Manutenção – “cobertura” 60,06 m² nº 1º TEN";
    expect(sanitizeForPdf(text)).toBe(text);
  });

  it("troca o que a fonte não desenha por interrogação e preserva quebras de linha", () => {
    expect(sanitizeForPdf("ok \u{1F600} → fim\nlinha 2�")).toBe("ok ? ? fim\nlinha 2?");
  });

  it("percorre objetos e listas aninhados sem mexer em números", () => {
    expect(sanitizeForPdf({ a: ["x→y", 3], b: { c: "ç" } })).toEqual({ a: ["x?y", 3], b: { c: "ç" } });
  });
});
