import { describe, expect, it } from "vitest";
import { dadosAlteracao, dadosFiscal, fiscalizacaoEscopo, idsOrdens } from "./fiscalizacao.js";
import type { AuthenticatedUser } from "../@types/AuthenticatedUser.js";

const user: AuthenticatedUser = { id: "u", name: "Coordenação", email: "u@example.com", role: "COORDENACAO", tenant_id: "a", approved: true };
describe("Gestão da fiscalização", () => {
  it("limita coordenação e master à própria unidade e permite seleção explícita ao admin", () => {
    for (const role of ["COORDENACAO", "MASTER"] as const) {
      expect(fiscalizacaoEscopo({ ...user, role }, undefined)).toBe("a");
      expect(() => fiscalizacaoEscopo({ ...user, role }, "b")).toThrow("sua unidade");
    }
    expect(fiscalizacaoEscopo({ ...user, role: "PLATFORM_ADMIN" }, "b")).toBe("b");
    for (const role of ["ENGENHARIA", "ADMINISTRATIVO", "USER", "EMPRESA"] as const) {
      expect(() => fiscalizacaoEscopo({ ...user, role }, "a")).toThrow("permissão");
    }
  });
  it("valida contatos, situação e normaliza o e-mail", () => {
    expect(dadosFiscal({ nome: " Fulano ", ramal: " 123 ", email: "FISCAL@Example.com ", ativo: true }).email).toBe("fiscal@example.com");
    expect(() => dadosFiscal({ nome: "a", ramal: "1", email: "inválido", ativo: true })).toThrow("e-mail válido");
    expect(() => dadosFiscal({ nome: "a", ramal: "1", email: "a@b.com", ativo: "false" })).toThrow("Situação");
  });
  it("rejeita datas impossíveis, futuras e alterações sem justificativa", () => {
    for (const vigencia of ["2026-02-30", "2099-01-01", "inválida"]) expect(() => dadosAlteracao({ vigencia, motivo: "Portaria" })).toThrow();
    expect(() => dadosAlteracao({ vigencia: "2026-01-01", motivo: " " })).toThrow("motivo");
    expect(dadosAlteracao({ vigencia: "2026-01-01", motivo: "Portaria" }).vigencia.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
  it("exige seleção explícita de OS sem duplicações", () => {
    for (const ids of [[], ["a", "a"], [1], "a"]) expect(() => idsOrdens(ids)).toThrow();
    expect(idsOrdens(["a", "b"])).toEqual(["a", "b"]);
  });
});
