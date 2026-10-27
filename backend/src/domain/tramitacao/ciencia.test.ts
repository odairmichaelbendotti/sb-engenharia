import { describe, expect, it } from "vitest";
import {
  calcularPrazoCiencia,
  getFaseEmissao,
  houveMudancaNoConteudo,
  isAguardandoCiencia,
  isCienciaDispensada,
  isCienciaVencida,
  podeEmpresaComentar,
  podeEmpresaContestar,
  podeFiscalizacaoTramitar,
  type OrdemServicoConteudo,
  type SituacaoCiencia,
} from "./ciencia.js";
import { DomainAccessPolicy } from "../polices/DomainAccessPolicy.js";

const emitidaEm = new Date("2026-10-23T14:30:00.000Z");
const prazo = new Date("2026-10-25T14:30:00.000Z");

function os(overrides: Partial<SituacaoCiencia> = {}): SituacaoCiencia {
  return {
    status: "ATIVO",
    emitidaEm,
    cienciaPrazoAte: prazo,
    cienciaDispensada: false,
    cienteEm: null,
    contestacoesAbertas: 0,
    ...overrides,
  };
}

const plusMs = (date: Date, ms: number) => new Date(date.getTime() + ms);

describe("calcularPrazoCiencia", () => {
  it("soma 48 horas corridas à emissão, inclusive em fim de semana", () => {
    expect(calcularPrazoCiencia(emitidaEm).toISOString()).toBe("2026-10-25T14:30:00.000Z");
    // Sexta à noite vence domingo à noite (dias corridos, não úteis)
    expect(calcularPrazoCiencia(new Date("2026-10-23T22:00:00.000Z")).toISOString()).toBe(
      "2026-10-25T22:00:00.000Z",
    );
  });
});

describe("dispensa da ciência", () => {
  it("OS antiga (marcada ou sem emissão) não exige ciência nem trava", () => {
    for (const antiga of [
      os({ cienciaDispensada: true }),
      os({ emitidaEm: null, cienciaPrazoAte: null }),
      os({ cienciaPrazoAte: null }),
    ]) {
      expect(isCienciaDispensada(antiga)).toBe(true);
      expect(isAguardandoCiencia(antiga)).toBe(false);
      expect(isCienciaVencida(antiga, plusMs(prazo, 1_000_000))).toBe(false);
      expect(getFaseEmissao(antiga, plusMs(prazo, 1))).toBe("DISPENSADA");
      expect(podeEmpresaContestar(antiga, emitidaEm)).toBe(false);
      expect(podeFiscalizacaoTramitar(antiga)).toBe(false);
    }
  });
});

describe("OS aguardando emissão", () => {
  it("tem fase própria e não abre ciência, apontamento nem trava", () => {
    const aguardando = os({ aguardandoEmissao: true, emitidaEm: null, cienciaPrazoAte: null });
    expect(getFaseEmissao(aguardando, plusMs(prazo, 1))).toBe("AGUARDANDO_EMISSAO");
    expect(isAguardandoCiencia(aguardando)).toBe(false);
    expect(isCienciaVencida(aguardando, plusMs(prazo, 1_000_000))).toBe(false);
    expect(podeEmpresaContestar(aguardando, emitidaEm)).toBe(false);
    expect(podeEmpresaComentar(aguardando, emitidaEm)).toBe(false);
    expect(podeFiscalizacaoTramitar(aguardando)).toBe(false);
  });
});

describe("trava por prazo vencido", () => {
  it("no instante exato do prazo ainda não venceu; um milissegundo depois, venceu", () => {
    expect(isCienciaVencida(os(), prazo)).toBe(false);
    expect(isCienciaVencida(os(), plusMs(prazo, 1))).toBe(true);
    expect(getFaseEmissao(os(), prazo)).toBe("AGUARDANDO_CIENCIA");
    expect(getFaseEmissao(os(), plusMs(prazo, 1))).toBe("CIENCIA_VENCIDA");
  });

  it("dar ciência destrava, mesmo depois do prazo", () => {
    const ciente = os({ cienteEm: plusMs(prazo, 60_000) });
    expect(isCienciaVencida(ciente, plusMs(prazo, 120_000))).toBe(false);
    expect(getFaseEmissao(ciente, plusMs(prazo, 120_000))).toBe("EFETIVADA");
  });

  it("OS cancelada ou finalizada não trava a empresa", () => {
    expect(isCienciaVencida(os({ status: "CANCELADO" }), plusMs(prazo, 1))).toBe(false);
    expect(isCienciaVencida(os({ status: "FINALIZADO" }), plusMs(prazo, 1))).toBe(false);
  });
});

describe("fase da emissão", () => {
  it("ciente com apontamento aberto fica em contestação até a decisão", () => {
    const now = plusMs(emitidaEm, 1000);
    expect(getFaseEmissao(os({ cienteEm: now, contestacoesAbertas: 2 }), now)).toBe("EM_CONTESTACAO");
    expect(getFaseEmissao(os({ cienteEm: now, contestacoesAbertas: 0 }), now)).toBe("EFETIVADA");
    // Sem ciência, o que conta é a ciência
    expect(getFaseEmissao(os({ contestacoesAbertas: 1 }), now)).toBe("AGUARDANDO_CIENCIA");
  });
});

describe("janela de apontamentos e comentários da empresa", () => {
  it("apontamento novo só até o fim do prazo de ciência", () => {
    expect(podeEmpresaContestar(os(), prazo)).toBe(true);
    expect(podeEmpresaContestar(os({ cienteEm: emitidaEm }), prazo)).toBe(true);
    expect(podeEmpresaContestar(os(), plusMs(prazo, 1))).toBe(false);
    expect(podeEmpresaContestar(os({ status: "CANCELADO" }), emitidaEm)).toBe(false);
  });

  it("depois do prazo só comenta se ainda houver apontamento aberto", () => {
    const depois = plusMs(prazo, 1);
    expect(podeEmpresaComentar(os(), depois)).toBe(false);
    expect(podeEmpresaComentar(os({ contestacoesAbertas: 1 }), depois)).toBe(true);
    expect(podeEmpresaComentar(os(), prazo)).toBe(true);
  });
});

describe("permissões por perfil", () => {
  const policy = new DomainAccessPolicy();

  it("só a EMPRESA dá ciência e registra apontamentos", () => {
    expect(policy.canDo("EMPRESA", "darCienciaOrdemServico")).toBe(true);
    for (const role of ["PLATFORM_ADMIN", "MASTER", "COORDENACAO", "ADMINISTRATIVO", "ENGENHARIA", "USER"] as const) {
      expect(policy.canDo(role, "darCienciaOrdemServico")).toBe(false);
    }
  });

  it("a fiscalização (perfis internos com edição) responde; EMPRESA, USER e PLATFORM_ADMIN não", () => {
    for (const role of ["MASTER", "COORDENACAO", "ADMINISTRATIVO", "ENGENHARIA"] as const) {
      expect(policy.canDo(role, "tramitarOrdemServico")).toBe(true);
    }
    for (const role of ["EMPRESA", "USER", "PLATFORM_ADMIN"] as const) {
      expect(policy.canDo(role, "tramitarOrdemServico")).toBe(false);
    }
  });
});

describe("houveMudancaNoConteudo", () => {
  const base: OrdemServicoConteudo = {
    numero: "OS 010/BAFL/2026-L1",
    empenhos: [
      { empenho_id: "e1", valor: 1000.1 },
      { empenho_id: "e2", valor: 50 },
    ],
    dataInicio: "2026-11-01",
    dataPrevisaoTermino: "2026-11-30",
    obra_id: "o1",
    lote_id: "l1",
    setorRequisitante: "SCOAM-FL",
    urgencia: "PROGRAMADA",
    dataVistoria: "2026-10-20",
    descricaoProblema: "Infiltração",
    dataEmissao: "2026-10-23",
    prazoMobilizacaoDias: 7,
    prazoDias: 30,
    totalComBdiCentavos: 123456,
    fiscalSetorial: null,
    fiscalTecnico_id: "f1",
    fiscalAdministrativo_id: "f2",
    condicoesEspeciais: ["Trabalho noturno"],
  };

  it("salvar sem mudar nada não reemite (a ordem dos empenhos não importa)", () => {
    expect(houveMudancaNoConteudo(base, { ...base, empenhos: [...base.empenhos].reverse() })).toBe(false);
    // 1000.1 em reais vira 100010 centavos dos dois lados, sem erro de ponto flutuante
    expect(houveMudancaNoConteudo(base, { ...base, empenhos: [{ empenho_id: "e1", valor: 1000.1 }, { empenho_id: "e2", valor: 50.0 }] })).toBe(false);
  });

  it("qualquer campo do documento alterado reemite", () => {
    expect(houveMudancaNoConteudo(base, { ...base, prazoDias: 31 })).toBe(true);
    expect(houveMudancaNoConteudo(base, { ...base, totalComBdiCentavos: 123457 })).toBe(true);
    expect(houveMudancaNoConteudo(base, { ...base, empenhos: [{ empenho_id: "e1", valor: 1000.1 }] })).toBe(true);
    expect(houveMudancaNoConteudo(base, { ...base, condicoesEspeciais: [] })).toBe(true);
    expect(houveMudancaNoConteudo(base, { ...base, obra_id: null })).toBe(true);
  });
});
