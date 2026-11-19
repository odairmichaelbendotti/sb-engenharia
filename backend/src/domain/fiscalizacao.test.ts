import { describe, expect, it } from "vitest";
import { dadosAlteracao, dadosFiscal, dadosRamal, fiscalizacaoEscopo, idsOrdens } from "./fiscalizacao.js";
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
  it("exige o usuário da unidade e ignora dados pessoais enviados pelo formulário", () => {
    expect(dadosFiscal({ user_id: " u1 ", nome: "Nome adulterado", ramal: "999", email: "outro@example.com", ativo: true })).toEqual({ user_id: "u1", ativo: true });
    expect(() => dadosFiscal({ nome: "Nome manual", ativo: true })).toThrow("Selecione um usuário");
    expect(() => dadosFiscal({ user_id: "u1", ativo: "false" })).toThrow("Situação");
    expect(dadosFiscal({ user_id: null, ativo: false })).toEqual({ user_id: null, ativo: false });
  });
  it("permite ramal opcional no perfil, limitado a 40 caracteres", () => {
    expect(dadosRamal(" 1234 ")).toBe("1234"); expect(dadosRamal("")).toBe("");
    expect(() => dadosRamal(1234)).toThrow("ramal"); expect(() => dadosRamal("1".repeat(41))).toThrow("ramal");
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
